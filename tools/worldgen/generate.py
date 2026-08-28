#!/usr/bin/env python3
"""Build and validate the deterministic Sable Reach GIS and runtime atlas.

The pinned GIS environment produces the canonical GeoTIFF/GeoPackage sources
and the compact TopoJSON, hillshade, and manifest runtime derivatives.
"""

from __future__ import annotations

import argparse
import heapq
import hashlib
import json
import math
import sqlite3
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np


ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).with_name("config") / "worldgen.v1.json"
WKT_PATH = Path(__file__).with_name("crs") / "veyl_local_grid_v1.wkt"
SOURCE_PATH = ROOT / "packages/content/manifests/sable-reach.atlas-source.json"
RUNTIME_PATH = ROOT / "packages/content/manifests/sable-reach.atlas-runtime.json"
SOURCE_ARTIFACT_DIRECTORY = ROOT / "tools/worldgen/generated/source"
RUNTIME_ARTIFACT_DIRECTORY = ROOT / "tools/worldgen/generated/runtime"
WORLDGEN_TEMP_DIRECTORY = ROOT / "tools/worldgen/.tmp"
GENERATOR_VERSION = "sable_reach_terrain_conditioned_worldgen_v3"


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_array(value: np.ndarray) -> str:
    array = np.ascontiguousarray(value)
    return sha256_bytes(array.tobytes(order="C"))


def rounded(value: float, digits: int = 4) -> float:
    return round(float(value), digits)


def stats(value: np.ndarray, digits: int = 4) -> dict[str, float]:
    return {
        "minimum": rounded(np.min(value), digits),
        "maximum": rounded(np.max(value), digits),
        "mean": rounded(np.mean(value, dtype=np.float64), digits),
        "standardDeviation": rounded(np.std(value, dtype=np.float64), digits),
    }


def normalize(value: np.ndarray) -> np.ndarray:
    lo = float(np.min(value))
    hi = float(np.max(value))
    if hi <= lo:
        return np.zeros_like(value, dtype=np.float32)
    return ((value - lo) / (hi - lo)).astype(np.float32)


def point_segment_distance(x: np.ndarray, y: np.ndarray, start: list[float], end: list[float]) -> np.ndarray:
    ax, ay = start
    bx, by = end
    dx, dy = bx - ax, by - ay
    denominator = dx * dx + dy * dy
    t = np.clip(((x - ax) * dx + (y - ay) * dy) / denominator, 0.0, 1.0)
    return np.hypot(x - (ax + t * dx), y - (ay + t * dy))


def spectral_noise(rows: int, columns: int, rng: np.random.Generator) -> np.ndarray:
    """Seeded smooth noise without a SciPy dependency."""
    result = np.zeros((rows, columns), dtype=np.float32)
    for spacing, amplitude in ((256, 8.0), (128, 3.2), (64, 1.2)):
        coarse_rows = math.ceil(rows / spacing) + 1
        coarse_columns = math.ceil(columns / spacing) + 1
        coarse = rng.standard_normal((coarse_rows, coarse_columns), dtype=np.float32)
        row_coordinate = np.arange(rows, dtype=np.float32) / spacing
        column_coordinate = np.arange(columns, dtype=np.float32) / spacing
        r0 = np.floor(row_coordinate).astype(np.int32)
        c0 = np.floor(column_coordinate).astype(np.int32)
        rf = (row_coordinate - r0)[:, None]
        cf = (column_coordinate - c0)[None, :]
        top = coarse[r0[:, None], c0[None, :]] * (1 - cf) + coarse[r0[:, None], c0[None, :] + 1] * cf
        bottom = coarse[r0[:, None] + 1, c0[None, :]] * (1 - cf) + coarse[r0[:, None] + 1, c0[None, :] + 1] * cf
        result += ((top * (1 - rf) + bottom * rf) * amplitude).astype(np.float32)
    return result


def nearest_cell(coordinate: Iterable[float], max_northing: float, cell_size: float, rows: int, columns: int) -> tuple[int, int]:
    easting, northing = coordinate
    column = min(columns - 1, max(0, int(float(easting) / cell_size)))
    row = min(rows - 1, max(0, int((max_northing - float(northing)) / cell_size)))
    return row, column


@dataclass(frozen=True)
class Terrain:
    raw: np.ndarray
    conditioned: np.ndarray
    slope: np.ndarray
    aspect: np.ndarray
    curvature: np.ndarray
    tpi: np.ndarray
    ruggedness: np.ndarray
    d8_direction: np.ndarray
    d8_receiver: np.ndarray
    d8_accumulation: np.ndarray
    watershed: np.ndarray
    stream_mask: np.ndarray
    wetness: np.ndarray
    hillshade: np.ndarray
    terminal_ids: tuple[str, ...]
    terminal_cells: tuple[tuple[int, int], ...]
    conditioning_audit: dict[str, Any]


def build_raw_terrain(config: dict[str, Any]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    grid = config["grid"]
    rows, columns, cell = grid["rows"], grid["columns"], grid["cellSizeMeters"]
    _, _, max_easting, max_northing = config["extent"]
    eastings = (np.arange(columns, dtype=np.float32) + 0.5) * cell
    northings = max_northing - (np.arange(rows, dtype=np.float32) + 0.5) * cell
    x, y = np.meshgrid(eastings, northings)
    rng = np.random.default_rng(config["seed"])

    raw = (-18.0 + 0.0138 * x + 0.0042 * y).astype(np.float32)
    raw -= (58.0 * np.exp(-((x / 1050.0) ** 2))).astype(np.float32)
    raw += (34.0 * np.exp(-(((x - 7200.0) / 3600.0) ** 2 + ((y - 9000.0) / 2100.0) ** 2))).astype(np.float32)
    raw += (68.0 * np.exp(-((point_segment_distance(x, y, [11392, 12032], [14592, 6656]) / 760.0) ** 2))).astype(np.float32)
    raw += (54.0 * np.exp(-((point_segment_distance(x, y, [7808, 768], [10944, 5248]) / 620.0) ** 2))).astype(np.float32)
    raw += (42.0 * np.exp(-((point_segment_distance(x, y, [5120, 11264], [9856, 9344]) / 840.0) ** 2))).astype(np.float32)
    raw -= (25.0 * np.exp(-((point_segment_distance(x, y, [7424, 7680], [0, 2560]) / 520.0) ** 2))).astype(np.float32)
    raw -= (20.0 * np.exp(-((point_segment_distance(x, y, [9472, 10880], [0, 8704]) / 580.0) ** 2))).astype(np.float32)
    raw -= (52.0 * np.exp(-(((x - 13632.0) / 1080.0) ** 2 + ((y - 3328.0) / 780.0) ** 2))).astype(np.float32)
    raw -= (26.0 * np.exp(-(((x - 5504.0) / 248.0) ** 2 + ((y - 3072.0) / 248.0) ** 2))).astype(np.float32)
    raw -= (22.0 * np.exp(-(((x - 6656.0) / 192.0) ** 2 + ((y - 4224.0) / 192.0) ** 2))).astype(np.float32)
    raw += spectral_noise(rows, columns, rng)

    hearth = config["hearthmere"]["origin"]
    hearth_row, hearth_column = nearest_cell(hearth[:2], max_northing, cell, rows, columns)
    correction = float(hearth[2]) - float(raw[hearth_row, hearth_column])
    local_terrace = np.exp(-(((x - hearth[0]) / 720.0) ** 2 + ((y - hearth[1]) / 520.0) ** 2))
    raw += (correction * local_terrace).astype(np.float32)
    return raw.astype(np.float32), x, y


def build_conditioned_surface(
    raw: np.ndarray,
    x: np.ndarray,
    y: np.ndarray,
    config: dict[str, Any],
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, tuple[str, ...], tuple[tuple[int, int], ...], dict[str, Any]]:
    """Minimally condition the authored DTM, then derive genuine D8 flow."""
    import rasterio
    from rasterio.transform import from_origin
    from whitebox import WhiteboxTools

    grid = config["grid"]
    rows, columns, cell = grid["rows"], grid["columns"], grid["cellSizeMeters"]
    max_northing = config["extent"][3]
    outlets = config["hydrology"]["declaredOutlets"]
    WORLDGEN_TEMP_DIRECTORY.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="sable-reach-hydrology-", dir=WORLDGEN_TEMP_DIRECTORY) as temporary_directory:
        temporary = Path(temporary_directory)
        source_path = temporary / "raw.tif"
        breached_path = temporary / "breached.tif"
        conditioned_path = temporary / "conditioned.tif"
        with rasterio.open(
            source_path, "w", driver="GTiff", width=columns, height=rows, count=1, dtype="float32",
            transform=from_origin(config["extent"][0], config["extent"][3], cell, cell),
            crs=rasterio.crs.CRS.from_wkt(WKT_PATH.read_text(encoding="utf-8")), nodata=grid["noData"],
        ) as dataset:
            dataset.write(raw, 1)
        whitebox = WhiteboxTools()
        breach_diagnostics: list[str] = []
        whitebox.set_verbose_mode(True)
        breach_result = whitebox.breach_depressions_least_cost(
            str(source_path), str(breached_path), dist=128, max_cost=50.0,
            min_dist=True, flat_increment=0.0001, fill=False, callback=breach_diagnostics.append,
        )
        if breach_result != 0 or not breached_path.exists():
            detail = " | ".join(breach_diagnostics[-12:]) or "WhiteboxTools returned no diagnostics"
            raise RuntimeError(f"Whitebox least-cost terrain breaching failed (result={breach_result}): {detail}")
        fill_diagnostics: list[str] = []
        fill_result = whitebox.fill_depressions_wang_and_liu(
            str(breached_path), str(conditioned_path), fix_flats=True,
            flat_increment=0.0001, callback=fill_diagnostics.append,
        )
        if fill_result != 0 or not conditioned_path.exists():
            detail = " | ".join(fill_diagnostics[-12:]) or "WhiteboxTools returned no diagnostics"
            raise RuntimeError(f"Whitebox residual depression fill failed (result={fill_result}): {detail}")
        with rasterio.open(conditioned_path) as dataset:
            conditioned = dataset.read(1).astype(np.float32)

    def line_cells(start: tuple[int, int], end: tuple[int, int]) -> list[tuple[int, int]]:
        row, column = start
        end_row, end_column = end
        cells = [(row, column)]
        while (row, column) != (end_row, end_column):
            if row != end_row:
                row += 1 if end_row > row else -1
            if column != end_column:
                column += 1 if end_column > column else -1
            cells.append((row, column))
        return cells

    # Restore real depressions, then cut a monotonic internal drain from each
    # natural low point to the declared pour cell using a 0.0002 m minimum
    # descent per cell. This preserves their authored shape instead of
    # blanket-filling or replacing them with synthetic bowls.
    depression_outlets = [outlet for outlet in outlets if outlet["kind"] in ("pond", "closed_basin")]
    declared_depression_cells: dict[tuple[int, int], str] = {}
    for outlet in depression_outlets:
        center = outlet["coordinate"]
        radius = outlet["preservationRadiusMeters"]
        mask = (x - center[0]) ** 2 + (y - center[1]) ** 2 <= radius ** 2
        conditioned[mask] = raw[mask]
        minimum_flat = int(np.argmin(np.where(mask, conditioned, np.inf)))
        minimum_cell = divmod(minimum_flat, columns)
        target_cell = nearest_cell(center, max_northing, cell, rows, columns)
        previous_elevation = float(conditioned[minimum_cell])
        for index, path_cell in enumerate(line_cells(minimum_cell, target_cell)[1:], start=1):
            previous_elevation = min(float(conditioned[path_cell]), previous_elevation - 0.0002)
            conditioned[path_cell] = np.float32(previous_elevation)
        declared_depression_cells[target_cell] = outlet["id"]

    direction = np.zeros(raw.shape, dtype=np.uint8)
    receiver_grid = np.full(raw.shape, -1, dtype=np.int32)
    best_slope = np.zeros(raw.shape, dtype=np.float32)
    flat_indexes = np.arange(raw.size, dtype=np.int32).reshape(raw.shape)
    offsets = ((0, 1, 1, 1.0), (1, 1, 2, math.sqrt(2)), (1, 0, 4, 1.0), (1, -1, 8, math.sqrt(2)), (0, -1, 16, 1.0), (-1, -1, 32, math.sqrt(2)), (-1, 0, 64, 1.0), (-1, 1, 128, math.sqrt(2)))
    for dr, dc, code, distance in offsets:
        source_rows = slice(max(0, -dr), min(rows, rows - dr))
        source_columns = slice(max(0, -dc), min(columns, columns - dc))
        neighbor_rows = slice(max(0, dr), min(rows, rows + dr))
        neighbor_columns = slice(max(0, dc), min(columns, columns + dc))
        slope = (conditioned[source_rows, source_columns] - conditioned[neighbor_rows, neighbor_columns]) / (cell * distance)
        take = slope > best_slope[source_rows, source_columns]
        best_slope[source_rows, source_columns][take] = slope[take]
        direction[source_rows, source_columns][take] = code
        receiver_grid[source_rows, source_columns][take] = flat_indexes[neighbor_rows, neighbor_columns][take]

    actual_terminal_cells = tuple((int(row), int(column)) for row, column in zip(*np.where(receiver_grid < 0)))
    external_outlets = [outlet for outlet in outlets if outlet["kind"] in ("coast", "boundary")]
    for outlet in external_outlets:
        side = outlet.get("boundarySide")
        if side not in ("west", "south", "north", "east"):
            raise ValueError(f"Boundary outlet {outlet['id']} requires an explicit boundarySide")
        if outlet["kind"] == "coast" and side != "west":
            raise ValueError(f"Coast outlet {outlet['id']} must lie on the west Veil Coast boundary")
        expected_axis_value = {"west": 0, "south": 0, "north": config["extent"][3], "east": config["extent"][2]}[side]
        actual_axis_value = outlet["coordinate"][0] if side in ("west", "east") else outlet["coordinate"][1]
        if actual_axis_value != expected_axis_value or outlet.get("captureRadiusMeters", 0) <= 0:
            raise ValueError(f"Boundary outlet {outlet['id']} has invalid side coordinate or capture radius")
    terminal_ids: list[str] = []
    for terminal_cell in actual_terminal_cells:
        if terminal_cell in declared_depression_cells:
            terminal_ids.append(declared_depression_cells[terminal_cell])
            continue
        row, column = terminal_cell
        if row not in (0, rows - 1) and column not in (0, columns - 1):
            raise ValueError(f"Undeclared interior hydrology terminal at row {row}, column {column}")
        easting = (column + 0.5) * cell
        northing = max_northing - (row + 0.5) * cell
        side = "north" if row == 0 else "south" if row == rows - 1 else "west" if column == 0 else "east"
        candidates = [outlet for outlet in external_outlets if outlet["boundarySide"] == side]
        along = (lambda outlet: abs(northing - outlet["coordinate"][1])) if side in ("west", "east") else (lambda outlet: abs(easting - outlet["coordinate"][0]))
        eligible = [outlet for outlet in candidates if along(outlet) <= outlet["captureRadiusMeters"]]
        if not eligible:
            raise ValueError(f"No declared {side} boundary outlet captures terminal at {easting}E, {northing}N")
        terminal_ids.append(min(eligible, key=along)["id"])

    receiver = receiver_grid.ravel()
    accumulation, watershed = d8_accumulate_and_label(receiver, conditioned, actual_terminal_cells)
    absolute_delta = np.abs(conditioned.astype(np.float64) - raw.astype(np.float64))
    nonterminal = receiver >= 0
    flat_raw = raw.ravel()
    raw_downhill_fraction = float(np.mean(flat_raw[receiver[nonterminal]] < flat_raw[nonterminal]))
    audit = {
        "method": "whitebox_least_cost_breach_wang_liu_fill_with_preserved_depressions_v3",
        "meanAbsoluteDeltaMeters": rounded(np.mean(absolute_delta), 6),
        "p95AbsoluteDeltaMeters": rounded(np.percentile(absolute_delta, 95), 6),
        "p99AbsoluteDeltaMeters": rounded(np.percentile(absolute_delta, 99), 6),
        "maximumAbsoluteDeltaMeters": rounded(np.max(absolute_delta), 6),
        "modifiedCellCount": int(np.count_nonzero(absolute_delta > 0.001)),
        "modifiedCellFraction": rounded(np.mean(absolute_delta > 0.001), 6),
        "rawConditionedCorrelation": rounded(np.corrcoef(raw.ravel(), conditioned.ravel())[0, 1], 8),
        "receiverRawDownhillFraction": rounded(raw_downhill_fraction, 8),
        "actualTerminalCellCount": len(actual_terminal_cells),
        "declaredOutletCount": len(outlets),
        "gates": {"maximumMeanAbsoluteDeltaMeters": 1.0, "maximumP95AbsoluteDeltaMeters": 5.0, "maximumP99AbsoluteDeltaMeters": 14.0, "maximumAbsoluteDeltaMeters": 25.0, "maximumModifiedCellFraction": 0.08, "minimumRawConditionedCorrelation": 0.995, "minimumReceiverRawDownhillFraction": 0.9},
    }
    return conditioned, direction, receiver, accumulation, watershed, tuple(terminal_ids), actual_terminal_cells, audit


def d8_accumulate_and_label(receiver: np.ndarray, conditioned: np.ndarray, terminal_cells: tuple[tuple[int, int], ...]) -> tuple[np.ndarray, np.ndarray]:
    rows, columns = conditioned.shape
    accumulation = np.ones(receiver.size, dtype=np.uint32)
    order = np.argsort(conditioned.ravel(), kind="stable")[::-1]
    for index in order:
        target = int(receiver[index])
        if target >= 0:
            accumulation[target] += accumulation[index]
    watershed = np.full(receiver.size, np.iinfo(np.uint16).max, dtype=np.uint16)
    for terminal_index, (row, column) in enumerate(terminal_cells):
        watershed[row * columns + column] = terminal_index
    for index in order[::-1]:
        target = int(receiver[index])
        if target >= 0:
            watershed[index] = watershed[target]
    if np.any(watershed == np.iinfo(np.uint16).max):
        raise ValueError("D8 watershed propagation left unlabeled cells")
    return accumulation.reshape((rows, columns)), watershed.reshape((rows, columns))


def mfd_wetness(conditioned: np.ndarray, slope: np.ndarray, factor: int = 4) -> tuple[np.ndarray, dict[str, Any]]:
    """Dispersive MFD accumulation at 32 m, expanded for habitat wetness."""
    small = conditioned[::factor, ::factor].astype(np.float64)
    rows, columns = small.shape
    accumulation = np.ones((rows, columns), dtype=np.float64)
    order = np.argsort(small.ravel(), kind="stable")[::-1]
    offsets = ((-1, -1, math.sqrt(2)), (-1, 0, 1), (-1, 1, math.sqrt(2)), (0, -1, 1), (0, 1, 1), (1, -1, math.sqrt(2)), (1, 0, 1), (1, 1, math.sqrt(2)))
    for flat in order:
        row, column = divmod(int(flat), columns)
        downslope: list[tuple[int, int, float]] = []
        for dr, dc, distance in offsets:
            rr, cc = row + dr, column + dc
            if 0 <= rr < rows and 0 <= cc < columns:
                drop = (small[row, column] - small[rr, cc]) / distance
                if drop > 0:
                    downslope.append((rr, cc, drop ** 1.1))
        total = sum(weight for _, _, weight in downslope)
        if total > 0:
            source = accumulation[row, column]
            for rr, cc, weight in downslope:
                accumulation[rr, cc] += source * weight / total
    expanded = np.repeat(np.repeat(accumulation, factor, axis=0), factor, axis=1)[: conditioned.shape[0], : conditioned.shape[1]]
    slope_tangent = np.tan(np.radians(np.maximum(slope.astype(np.float64), 0.05)))
    raw_wetness = np.log1p(expanded * (factor * 8) ** 2) / (slope_tangent + 0.001)
    wetness = normalize(np.log1p(raw_wetness))
    return wetness, {"routingCellSizeMeters": factor * 8, "routingRows": rows, "routingColumns": columns, "distributionExponent": 1.1}


def build_terrain(config: dict[str, Any]) -> tuple[Terrain, dict[str, Any]]:
    raw, x, y = build_raw_terrain(config)
    grid = config["grid"]
    cell = float(grid["cellSizeMeters"])
    conditioned, direction, receiver, accumulation, watershed, terminal_ids, terminal_cells, conditioning_audit = build_conditioned_surface(raw, x, y, config)
    dz_dnorth, dz_deast = np.gradient(raw.astype(np.float64), -cell, cell)
    slope = np.degrees(np.arctan(np.hypot(dz_deast, dz_dnorth))).astype(np.float32)
    aspect = (np.degrees(np.arctan2(dz_deast, dz_dnorth)) + 360.0) % 360.0
    aspect[np.hypot(dz_deast, dz_dnorth) < 1e-8] = -1.0
    aspect = aspect.astype(np.float32)
    padded = np.pad(raw, 1, mode="edge")
    neighbors = [padded[dr : dr + raw.shape[0], dc : dc + raw.shape[1]] for dr in range(3) for dc in range(3) if (dr, dc) != (1, 1)]
    neighbor_sum = np.zeros_like(raw, dtype=np.float32)
    rugged_sum = np.zeros_like(raw, dtype=np.float32)
    for neighbor in neighbors:
        neighbor_sum += neighbor
        rugged_sum += (raw - neighbor) ** 2
    tpi = (raw - neighbor_sum / 8.0).astype(np.float32)
    ruggedness = np.sqrt(rugged_sum).astype(np.float32)
    curvature = ((padded[1:-1, :-2] + padded[1:-1, 2:] + padded[:-2, 1:-1] + padded[2:, 1:-1] - 4 * raw) / (cell * cell)).astype(np.float32)
    stream_mask = (accumulation >= 4000).astype(np.uint8)
    wetness, mfd_metadata = mfd_wetness(conditioned, slope)
    altitude = math.radians(45)
    slope_rad = np.radians(slope)
    aspects = np.radians(np.where(aspect < 0, 0, aspect))
    shades = []
    for azimuth_degrees in (225, 270, 315, 360):
        azimuth = math.radians(azimuth_degrees)
        shade = np.sin(altitude) * np.cos(slope_rad) + np.cos(altitude) * np.sin(slope_rad) * np.cos(azimuth - aspects)
        shades.append(np.clip(shade, 0, 1))
    hillshade = np.mean(shades, axis=0, dtype=np.float32).astype(np.float32)
    terrain = Terrain(raw, conditioned, slope, aspect, curvature, tpi, ruggedness, direction, receiver.reshape(raw.shape), accumulation, watershed, stream_mask, wetness, hillshade, terminal_ids, terminal_cells, conditioning_audit)
    return terrain, mfd_metadata


def point_on_segment(point: tuple[float, float], start: list[float], end: list[float], epsilon: float = 1e-7) -> bool:
    px, py = point
    ax, ay = start
    bx, by = end
    cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax)
    if abs(cross) > epsilon:
        return False
    return min(ax, bx) - epsilon <= px <= max(ax, bx) + epsilon and min(ay, by) - epsilon <= py <= max(ay, by) + epsilon


def point_in_polygon(point: tuple[float, float], polygon: list[list[float]], include_boundary: bool = True) -> bool:
    inside = False
    previous = polygon[-1]
    for current in polygon:
        if point_on_segment(point, previous, current):
            return include_boundary
        if (current[1] > point[1]) != (previous[1] > point[1]):
            intersection = (previous[0] - current[0]) * (point[1] - current[1]) / (previous[1] - current[1]) + current[0]
            if point[0] < intersection:
                inside = not inside
        previous = current
    return inside


def territory_for_point(point: tuple[float, float], territories: list[dict[str, Any]]) -> str:
    owners = [territory["id"] for territory in territories if point_in_polygon(point, territory["polygon"], False)]
    if len(owners) != 1:
        # Shared edges are resolved only for exact boundary coordinates. Macro
        # cell centers and authored sites must otherwise have one owner.
        boundary = [territory["id"] for territory in territories if point_in_polygon(point, territory["polygon"], True)]
        if boundary:
            # Polygon boundaries have zero area. Resolve exact shared-edge
            # addresses by stable source order (the coverage itself remains
            # exclusive under half-open point classification).
            return boundary[0]
        raise ValueError(f"Point {point} has {len(owners)} strict territory owners and {len(boundary)} boundary owners")
    return owners[0]


def sampled_elevation(terrain: np.ndarray, coordinate: Iterable[float], config: dict[str, Any]) -> float:
    row, column = nearest_cell(coordinate, config["extent"][3], config["grid"]["cellSizeMeters"], config["grid"]["rows"], config["grid"]["columns"])
    return float(terrain[row, column])


def build_streams(config: dict[str, Any], terrain: Terrain) -> list[dict[str, Any]]:
    terminal_by_id = {item["id"]: item for item in config["hydrology"]["declaredOutlets"]}
    terminal_id_by_cell = {cell: terminal_id for cell, terminal_id in zip(terrain.terminal_cells, terrain.terminal_ids)}
    direction_offsets = {1: (0, 1), 2: (1, 1), 4: (1, 0), 8: (1, -1), 16: (0, -1), 32: (-1, -1), 64: (-1, 0), 128: (-1, 1)}
    max_northing = config["extent"][3]
    cell_size = config["grid"]["cellSizeMeters"]
    streams: list[dict[str, Any]] = []
    for stream in config["hydrology"]["namedStreams"]:
        terminal = terminal_by_id[stream["terminalId"]]
        configured_coordinates = stream["coordinates"]
        if configured_coordinates[-1] != terminal["coordinate"]:
            raise ValueError(f"{stream['id']} does not terminate at {stream['terminalId']}")
        row, column = nearest_cell(configured_coordinates[0], max_northing, cell_size, terrain.raw.shape[0], terrain.raw.shape[1])
        start_watershed = int(terrain.watershed[row, column])
        if terrain.terminal_ids[start_watershed] != stream["terminalId"]:
            raise ValueError(f"{stream['id']} headwater is outside terminal watershed")
        trace = [(row, column)]
        while int(terrain.d8_direction[row, column]) != 0:
            offset = direction_offsets[int(terrain.d8_direction[row, column])]
            row, column = row + offset[0], column + offset[1]
            trace.append((row, column))
            if len(trace) > terrain.raw.size:
                raise ValueError(f"{stream['id']} D8 trace did not terminate")
        if terminal_id_by_cell.get((row, column)) != stream["terminalId"]:
            raise ValueError(f"{stream['id']} reached the wrong terminal cell")
        compressed = [trace[0]]
        previous_offset = None
        for index in range(1, len(trace)):
            offset = (trace[index][0] - trace[index - 1][0], trace[index][1] - trace[index - 1][1])
            if previous_offset is not None and offset != previous_offset:
                compressed.append(trace[index - 1])
            previous_offset = offset
        if trace[-1] != compressed[-1]:
            compressed.append(trace[-1])
        coordinates = [[rounded((column + 0.5) * cell_size, 2), rounded(max_northing - (row + 0.5) * cell_size, 2)] for row, column in compressed]
        elevations = [rounded(terrain.conditioned[row, column], 6) for row, column in compressed]
        total_length = sum(math.dist(coordinates[index], coordinates[index + 1]) for index in range(len(coordinates) - 1))
        stream_intersections = sum(int(terrain.stream_mask[trace_row, trace_column]) for trace_row, trace_column in trace)
        streams.append({
            "id": stream["id"], "name": stream["name"], "terminalId": stream["terminalId"],
            "coordinates": coordinates, "modeledBedElevationsMeters": elevations,
            "lengthMeters": rounded(total_length, 1), "profileStatus": "modeled_monotonic_not_surveyed",
            "d8TraceCellCount": len(trace), "streamMaskIntersectionCells": stream_intersections,
        })
    return streams


def simplify_grid_path(path: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if len(path) <= 2:
        return path
    simplified = [path[0]]
    previous_direction = (path[1][0] - path[0][0], path[1][1] - path[0][1])
    for index in range(1, len(path) - 1):
        direction = (path[index + 1][0] - path[index][0], path[index + 1][1] - path[index][1])
        if direction != previous_direction:
            simplified.append(path[index])
        previous_direction = direction
    simplified.append(path[-1])
    return simplified


def least_cost_route(start: list[float], end: list[float], route_class: str, terrain: Terrain, config: dict[str, Any]) -> tuple[list[list[float]], dict[str, Any]]:
    factor = 16
    cell_size = config["grid"]["cellSizeMeters"] * factor
    rows, columns = terrain.raw.shape[0] // factor, terrain.raw.shape[1] // factor
    slope = terrain.slope.reshape(rows, factor, columns, factor).mean(axis=(1, 3))
    wetness = terrain.wetness.reshape(rows, factor, columns, factor).mean(axis=(1, 3))
    stream = terrain.stream_mask.reshape(rows, factor, columns, factor).max(axis=(1, 3))
    slope_weight = {"road": 0.032, "causeway": 0.02, "trail": 0.015}[route_class]
    wetness_weight = {"road": 2.2, "causeway": 0.55, "trail": 1.25}[route_class]
    crossing_weight = {"road": 5.0, "causeway": 1.2, "trail": 3.0}[route_class]
    substrate_penalties = {
        "road": {"marine_alluvium": 0.45, "peat": 1.15, "slate": 0.05, "karst_limestone": 0.45, "salt_clay": 0.8, "volcanic_ironstone": 0.35},
        "causeway": {"marine_alluvium": 0.25, "peat": 0.2, "slate": 0.3, "karst_limestone": 0.5, "salt_clay": 0.85, "volcanic_ironstone": 0.55},
        "trail": {"marine_alluvium": 0.35, "peat": 0.65, "slate": 0.15, "karst_limestone": 0.25, "salt_clay": 0.35, "volcanic_ironstone": 0.3},
    }[route_class]
    substrate = np.zeros((rows, columns), dtype=np.float32)
    territory_by_id = {territory["id"]: territory for territory in config["territories"]}
    for row in range(rows):
        for column in range(columns):
            territory_id = territory_for_point(((column + 0.5) * cell_size, config["extent"][3] - (row + 0.5) * cell_size), config["territories"])
            substrate[row, column] = substrate_penalties[territory_by_id[territory_id]["substrate"]]
    traversal = 1.0 + np.maximum(slope - 4.0, 0.0) ** 2 * slope_weight + wetness * wetness_weight + stream * crossing_weight + substrate
    start_cell = nearest_cell(start, config["extent"][3], cell_size, rows, columns)
    end_cell = nearest_cell(end, config["extent"][3], cell_size, rows, columns)
    start_flat = start_cell[0] * columns + start_cell[1]
    end_flat = end_cell[0] * columns + end_cell[1]
    distances = np.full(rows * columns, np.inf, dtype=np.float64)
    distances[start_flat] = 0
    previous = np.full(rows * columns, -1, dtype=np.int32)
    pending: list[tuple[float, int]] = [(0.0, start_flat)]
    offsets = ((-1, -1, math.sqrt(2)), (-1, 0, 1.0), (-1, 1, math.sqrt(2)), (0, -1, 1.0), (0, 1, 1.0), (1, -1, math.sqrt(2)), (1, 0, 1.0), (1, 1, math.sqrt(2)))
    while pending:
        cost, flat = heapq.heappop(pending)
        if cost != distances[flat]:
            continue
        if flat == end_flat:
            break
        row, column = divmod(flat, columns)
        for dr, dc, distance_factor in offsets:
            rr, cc = row + dr, column + dc
            if not (0 <= rr < rows and 0 <= cc < columns):
                continue
            neighbor = rr * columns + cc
            step_cost = cell_size * distance_factor * (float(traversal[row, column]) + float(traversal[rr, cc])) / 2
            candidate = cost + step_cost
            if candidate < distances[neighbor]:
                distances[neighbor] = candidate
                previous[neighbor] = flat
                heapq.heappush(pending, (candidate, neighbor))
    if not math.isfinite(float(distances[end_flat])):
        raise ValueError(f"No least-cost route between {start} and {end}")
    reversed_path = [end_flat]
    cursor = end_flat
    while cursor != start_flat:
        cursor = int(previous[cursor])
        if cursor < 0:
            raise ValueError("Least-cost predecessor chain broke")
        reversed_path.append(cursor)
    cells = [divmod(flat, columns) for flat in reversed(reversed_path)]
    simplified = simplify_grid_path(cells)
    geometry = [[rounded(start[0], 2), rounded(start[1], 2)]]
    geometry.extend([[rounded((column + 0.5) * cell_size, 2), rounded(config["extent"][3] - (row + 0.5) * cell_size, 2)] for row, column in simplified])
    geometry.append([rounded(end[0], 2), rounded(end[1], 2)])
    geometry = [point for index, point in enumerate(geometry) if index == 0 or point != geometry[index - 1]]
    audit = {
        "algorithm": "least_cost_raster_dijkstra_v1", "analysisCellSizeMeters": cell_size,
        "impedanceCost": rounded(distances[end_flat], 3), "visitedCellCount": int(np.isfinite(distances).sum()),
        "slopeWeight": slope_weight, "wetnessWeight": wetness_weight, "streamCrossingWeight": crossing_weight,
        "substratePenalties": substrate_penalties,
        "streamCrossingCellCount": sum(int(stream[row, column]) for row, column in cells),
    }
    return geometry, audit


def build_routes(config: dict[str, Any], terrain: Terrain) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    sites = {site["id"]: site for site in config["sites"]}
    routes: list[dict[str, Any]] = []
    graph_edges: list[dict[str, Any]] = []
    speed = {"road": 4.2, "causeway": 3.2, "trail": 2.3}
    for route in config["roads"]:
        sections = []
        for index in range(len(route["nodes"]) - 1):
            start_id, end_id = route["nodes"][index : index + 2]
            geometry, audit = least_cost_route(sites[start_id]["coordinate"][:2], sites[end_id]["coordinate"][:2], route["class"], terrain, config)
            length = sum(math.dist(geometry[position], geometry[position + 1]) for position in range(len(geometry) - 1))
            travel_seconds = length / speed[route["class"]]
            section_id = f"{route['id']}.section.{index + 1:02}"
            section = {"id": section_id, "fromSiteId": start_id, "toSiteId": end_id, "coordinates": geometry, "lengthMeters": rounded(length, 1), "walkingSeconds": round(travel_seconds), "leastCostAudit": audit}
            sections.append(section)
            graph_edges.append({"id": section_id, "from": start_id, "to": end_id, "bidirectional": True, "costSeconds": round(travel_seconds)})
        routes.append({**route, "sections": sections})
    return routes, {"travelMode": {"id": "travel.walking.v1", "impedance": "seconds", "hierarchy": False, "restrictions": ["declared_closed_section"], "uTurnPolicy": "at_sites_only"}, "nodes": sorted(sites), "edges": graph_edges}


def build_bridges(routes: list[dict[str, Any]], streams: list[dict[str, Any]]) -> list[dict[str, Any]]:
    from shapely.geometry import LineString, Point

    sections = [(section["id"], LineString(section["coordinates"])) for route in routes for section in route["sections"]]
    stream_lines = [(stream["id"], LineString(stream["coordinates"])) for stream in streams]
    candidates: list[tuple[Point, str, str]] = []
    for section_id, section_line in sections:
        for stream_id, stream_line in stream_lines:
            intersection = section_line.intersection(stream_line)
            points: list[Point] = []
            if intersection.geom_type == "Point":
                points = [intersection]
            elif intersection.geom_type == "MultiPoint":
                points = list(intersection.geoms)
            elif intersection.geom_type in ("LineString", "MultiLineString") and not intersection.is_empty:
                points = [intersection.interpolate(0.5, normalized=True)]
            elif intersection.geom_type == "GeometryCollection":
                points = [geometry for geometry in intersection.geoms if geometry.geom_type == "Point"]
            candidates.extend((point, section_id, stream_id) for point in points)
    bridges = []
    seen: set[tuple[int, int]] = set()
    for point, section_id, stream_id in candidates:
        key = (round(point.x * 1000), round(point.y * 1000))
        if key in seen:
            continue
        touching_sections = [candidate_id for candidate_id, line in sections if line.distance(point) <= 0.001]
        touching_streams = [candidate_id for candidate_id, line in stream_lines if line.distance(point) <= 0.001]
        if touching_sections != [section_id] or touching_streams != [stream_id]:
            continue
        seen.add(key)
        bridges.append({"id": f"bridge.modeled.{len(bridges) + 1:02}", "coordinate": [rounded(point.x, 3), rounded(point.y, 3)], "routeSectionId": section_id, "streamId": stream_id, "kind": "modeled_crossing", "status": "atlas_validated_not_production_asset"})
    if not bridges:
        raise ValueError("Least-cost route network produced no unambiguous route/stream bridge crossings")
    return bridges


def build_macro_cells(config: dict[str, Any], terrain: Terrain, routes: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    macro = config["macroGrid"]
    factor = macro["cellSizeMeters"] // config["grid"]["cellSizeMeters"]
    route_substrates_by_cell: dict[tuple[int, int], set[str]] = {}
    for route in routes:
        for section in route["sections"]:
            coordinates = section["coordinates"]
            for start, end in zip(coordinates, coordinates[1:]):
                segment_length = math.dist(start, end)
                samples = max(1, math.ceil(segment_length / (macro["cellSizeMeters"] / 4)))
                for sample in range(samples + 1):
                    fraction = sample / samples
                    easting = start[0] + (end[0] - start[0]) * fraction
                    northing = start[1] + (end[1] - start[1]) * fraction
                    column = min(macro["columns"] - 1, max(0, int(easting // macro["cellSizeMeters"])))
                    south_row = min(macro["rows"] - 1, max(0, int(northing // macro["cellSizeMeters"])))
                    route_substrates_by_cell.setdefault((south_row, column), set()).add(route["class"])
    territory_codes = {territory["id"]: territory["code"] for territory in config["territories"]}
    habitat_codes = {habitat["id"]: chr(ord("a") + index) for index, habitat in enumerate(config["habitats"])}
    land_cover_by_territory = {
        "territory.veil-coast": ("tide_flat", "T"), "territory.dunmire": ("drowned_peat", "D"),
        "territory.graven-march": ("slate_upland", "G"), "territory.hollow-abbey": ("karst_scrub", "K"),
        "territory.mirror-salt-waste": ("salt_playa", "S"), "territory.cinderward": ("cinder_ridge", "C"),
    }
    records: list[str] = []
    territory_rows: list[str] = []
    habitat_availability = {habitat["id"]: [] for habitat in config["habitats"]}
    land_cover_values: list[str] = []
    traversal_values: list[int] = []
    corruption_values: list[int] = []
    suitability_values: list[str] = []
    corruption = normalize(0.55 * terrain.wetness + 0.45 * normalize(np.abs(terrain.curvature)))
    for south_row in range(macro["rows"]):
        territory_row = []
        raster_row = macro["rows"] - 1 - south_row
        for column in range(macro["columns"]):
            easting = (column + 0.5) * macro["cellSizeMeters"]
            northing = (south_row + 0.5) * macro["cellSizeMeters"]
            territory_id = territory_for_point((easting, northing), config["territories"])
            territory_row.append(territory_codes[territory_id])
            rs = slice(raster_row * factor, (raster_row + 1) * factor)
            cs = slice(column * factor, (column + 1) * factor)
            elevation = float(np.mean(terrain.raw[rs, cs]))
            slope = float(np.mean(terrain.slope[rs, cs]))
            moisture = float(np.mean(terrain.wetness[rs, cs]))
            corrupt = float(np.mean(corruption[rs, cs]))
            territory = next(item for item in config["territories"] if item["id"] == territory_id)
            if territory_id == "territory.mirror-salt-waste":
                # Salt corruption is a directional curse, not a wetness signal.
                # Give the preserved playa its authored occult baseline.
                corrupt = max(corrupt, 0.62)
            habitat_matches = []
            for habitat in config["habitats"]:
                if territory_id not in habitat["territoryIds"]:
                    continue
                route_substrates = set(habitat["substrates"]) & {"road", "causeway"}
                if route_substrates:
                    if not route_substrates & route_substrates_by_cell.get((south_row, column), set()):
                        continue
                elif territory["substrate"] not in habitat["substrates"]:
                    continue
                if habitat["elevationMeters"][0] <= elevation <= habitat["elevationMeters"][1] and habitat["slopeDegrees"][0] <= slope <= habitat["slopeDegrees"][1] and habitat["moisture"][0] <= moisture <= habitat["moisture"][1] and habitat["corruption"][0] <= corrupt <= habitat["corruption"][1]:
                    habitat_matches.append(habitat["id"])
            cell_id = f"atlas.cell.r{south_row:02}.c{column:02}"
            for habitat_id in habitat_matches:
                habitat_availability[habitat_id].append(cell_id)
            land_cover_name, land_cover_code = land_cover_by_territory[territory_id]
            traversal_cost = round((1.0 + max(0.0, slope - 4.0) ** 2 * 0.025 + moisture * 1.4 + (0.6 if land_cover_name in ("drowned_peat", "salt_playa") else 0.0)) * 1000)
            habitat_value = "".join(habitat_codes[item] for item in habitat_matches) or "-"
            land_cover_values.append(land_cover_code)
            traversal_values.append(traversal_cost)
            corruption_values.append(round(corrupt * 1000))
            suitability_values.append(habitat_value)
            body = f"{cell_id}|{territory_codes[territory_id]}|{round(elevation * 10)}|{round(slope * 100)}|{round(moisture * 1000)}|{round(corrupt * 1000)}|{land_cover_code}|{traversal_cost}|{habitat_value}"
            records.append(f"{body}|{sha256_bytes(body.encode('utf-8'))}")
        territory_rows.append("".join(territory_row))
    availability = {habitat_id: {"viableCellCount": len(cells), "representativeCellIds": cells[:8], "cellSetSha256": sha256_bytes(canonical_bytes(cells))} for habitat_id, cells in habitat_availability.items()}
    manifest = {
        "columns": macro["columns"], "rows": macro["rows"], "cellSizeMeters": macro["cellSizeMeters"], "count": len(records),
        "rowOrigin": "south", "columnOrigin": "west", "idPattern": "atlas.cell.r{row:02}.c{column:02}",
        "legacyTileRelationship": "none", "territoryCodeRowsSouthToNorth": territory_rows,
        "recordEncoding": ["cellId", "territoryCode", "meanElevationDecimeters", "meanSlopeCentidegrees", "meanMoisturePermille", "meanCorruptionPermille", "landCoverCode", "traversalCostMilliMultiplier", "habitatCodes", "sha256OfPrecedingFields"],
        "landCoverCodebook": {code: name for name, code in land_cover_by_territory.values()},
        "habitatCodebook": {code: habitat_id for habitat_id, code in habitat_codes.items()}, "records": records,
        "recordsSha256": sha256_bytes(canonical_bytes(records)),
        "alignedDerivatives": [
            {"id": "land_cover", "dataType": "categorical_code", "units": "class", "sha256": sha256_bytes(canonical_bytes(land_cover_values)), "classCount": len(set(land_cover_values))},
            {"id": "traversal_cost", "dataType": "uint16", "units": "milli_cost_multiplier", "sha256": sha256_bytes(canonical_bytes(traversal_values)), "statistics": {"minimum": min(traversal_values), "maximum": max(traversal_values), "mean": rounded(sum(traversal_values) / len(traversal_values), 3)}},
            {"id": "corruption", "dataType": "uint16", "units": "normalized_permille", "sha256": sha256_bytes(canonical_bytes(corruption_values)), "statistics": {"minimum": min(corruption_values), "maximum": max(corruption_values), "mean": rounded(sum(corruption_values) / len(corruption_values), 3)}},
            {"id": "habitat_suitability", "dataType": "sparse_binary_weights", "units": "habitat_code_weight_0_or_1", "sha256": sha256_bytes(canonical_bytes(suitability_values)), "nonemptyCellCount": sum(value != "-" for value in suitability_values), "weightSemantics": {"listedHabitatWeight": 1, "unlistedHabitatWeight": 0}},
        ],
        "habitatWeightEncoding": {"kind": "sparse_binary_membership", "listedHabitatWeight": 1, "unlistedHabitatWeight": 0, "emptyToken": "-", "codebookField": "habitatCodebook"},
    }
    return manifest, availability


def terrain_layers(terrain: Terrain, mfd_metadata: dict[str, Any]) -> list[dict[str, Any]]:
    definitions = [
        ("dtm_raw", terrain.raw, "float32", "meters", "authored constraints plus seeded multiscale interpolated noise"),
        ("dtm_conditioned", terrain.conditioned, "float32", "meters", "Whitebox least-cost breach plus residual fill, with declared natural depressions restored"),
        ("slope_degrees", terrain.slope, "float32", "degrees", "centered metric gradient"),
        ("aspect_degrees", terrain.aspect, "float32", "degrees_clockwise_from_north", "circular aspect; flat sentinel -1"),
        ("curvature_laplacian", terrain.curvature, "float32", "inverse_meters", "five-point Laplacian"),
        ("tpi_3x3", terrain.tpi, "float32", "meters", "center minus eight-neighbor mean"),
        ("ruggedness_tri", terrain.ruggedness, "float32", "meters", "Riley root-sum-square difference"),
        ("d8_flow_direction", terrain.d8_direction, "uint8", "d8_code", "single receiver toward a declared terminal"),
        ("d8_flow_accumulation", terrain.d8_accumulation, "uint32", "cells", "upstream cells including self"),
        ("d8_watershed", terrain.watershed, "uint16", "terminal_index", "terrain-derived terminal catchment label"),
        ("stream_mask", terrain.stream_mask, "uint8", "boolean", "D8 accumulation >= 4000 cells at 8 meters"),
        ("mfd_wetness", terrain.wetness, "float32", "normalized_0_1", f"MFD at {mfd_metadata['routingCellSizeMeters']} meters, log wetness proxy expanded to DTM alignment"),
        ("hillshade_multidirectional", terrain.hillshade, "float32", "normalized_0_1", "mean 225/270/315/360 degree azimuth, 45 degree altitude"),
    ]
    return [{"id": layer_id, "dataType": data_type, "units": units, "algorithm": algorithm, "statistics": stats(array), "sha256": sha256_array(array)} for layer_id, array, data_type, units, algorithm in definitions]


def write_geotiff(
    path: Path,
    arrays: list[np.ndarray],
    descriptions: list[str],
    config: dict[str, Any],
    data_type: str,
    resampling_name: str,
) -> None:
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.transform import from_origin

    path.parent.mkdir(parents=True, exist_ok=True)
    profile = {
        "driver": "GTiff",
        "width": config["grid"]["columns"],
        "height": config["grid"]["rows"],
        "count": len(arrays),
        "dtype": data_type,
        "crs": rasterio.crs.CRS.from_wkt(WKT_PATH.read_text(encoding="utf-8")),
        "transform": from_origin(config["extent"][0], config["extent"][3], config["grid"]["cellSizeMeters"], config["grid"]["cellSizeMeters"]),
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256,
        "compress": "DEFLATE",
        "zlevel": 9,
        "predictor": 3 if data_type.startswith("float") else 2,
        "interleave": "band",
        "BIGTIFF": "IF_SAFER",
    }
    with rasterio.Env(GDAL_NUM_THREADS="ALL_CPUS"):
        with rasterio.open(path, "w", **profile) as dataset:
            dataset.update_tags(
                generator=GENERATOR_VERSION,
                classification="fictional_modeled_not_measured",
                horizontal_units="meters",
                vertical_units="meters",
                sample_location="cell_center",
                AREA_OR_POINT="Area",
            )
            for band, (array, description) in enumerate(zip(arrays, descriptions), start=1):
                dataset.write(array.astype(data_type, copy=False), band)
                dataset.set_band_description(band, description)
            overview_resampling = getattr(Resampling, resampling_name)
            dataset.build_overviews([2, 4, 8, 16], overview_resampling)
            dataset.update_tags(ns="rio_overview", resampling=resampling_name)


def write_geopackage(path: Path, config: dict[str, Any], routes: list[dict[str, Any]], streams: list[dict[str, Any]], bridges: list[dict[str, Any]]) -> None:
    import geopandas as gpd
    from pyproj import CRS
    from shapely.geometry import LineString, Point, Polygon

    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    crs = CRS.from_wkt(WKT_PATH.read_text(encoding="utf-8"))

    layers: list[tuple[str, Any]] = []
    layers.append(("territories", gpd.GeoDataFrame(
        [{key: territory[key] for key in ("id", "name", "code", "substrate")} for territory in config["territories"]],
        geometry=[Polygon(territory["polygon"]) for territory in config["territories"]], crs=crs,
    )))
    layers.append(("sites", gpd.GeoDataFrame(
        [{"id": site["id"], "name": site["name"], "kind": site["kind"], "territory_id": site["territoryId"], "water_source": site.get("waterSource"), "access": site.get("access"), "subsistence": site.get("subsistence"), "industry": site.get("industry"), "burial": site.get("burialPractice"), "governance": site.get("governance")} for site in config["sites"]],
        geometry=[Point(*site["coordinate"]) for site in config["sites"]], crs=crs,
    )))
    route_records = []
    route_geometry = []
    for route in routes:
        for section in route["sections"]:
            route_records.append({"id": section["id"], "route_id": route["id"], "name": route["name"], "class": route["class"], "surface": route["surface"], "from_site": section["fromSiteId"], "to_site": section["toSiteId"], "length_m": section["lengthMeters"], "walk_sec": section["walkingSeconds"], "history": route["historicalReason"]})
            route_geometry.append(LineString(section["coordinates"]))
    layers.append(("routes", gpd.GeoDataFrame(route_records, geometry=route_geometry, crs=crs)))
    layers.append(("streams", gpd.GeoDataFrame(
        [{"id": stream["id"], "name": stream["name"], "terminal_id": stream["terminalId"], "length_m": stream["lengthMeters"], "bed_profile": json.dumps(stream["modeledBedElevationsMeters"], separators=(",", ":")), "status": stream["profileStatus"]} for stream in streams],
        geometry=[LineString(stream["coordinates"]) for stream in streams], crs=crs,
    )))
    layers.append(("bridges", gpd.GeoDataFrame(
        [{"id": bridge["id"], "route_section": bridge["routeSectionId"], "stream_id": bridge["streamId"], "kind": bridge["kind"], "status": bridge["status"]} for bridge in bridges],
        geometry=[Point(*bridge["coordinate"]) for bridge in bridges], crs=crs,
    )))
    terminals = config["hydrology"]["declaredOutlets"]
    layers.append(("hydrology_terminals", gpd.GeoDataFrame(
        [{"id": terminal["id"], "kind": terminal["kind"]} for terminal in terminals],
        geometry=[Point(*terminal["coordinate"]) for terminal in terminals], crs=crs,
    )))
    proof_sites = {site["id"]: site for site in config["sites"]}
    layers.append(("proof_locations", gpd.GeoDataFrame(
        [{"id": proof["id"], "site_id": proof["siteId"], "cell_col": proof["macroCell"][0], "cell_row": proof["macroCell"][1]} for proof in config["proofCells"]],
        geometry=[Point(*proof_sites[proof["siteId"]]["coordinate"]) for proof in config["proofCells"]], crs=crs,
    )))
    habitat_records = []
    habitat_geometry = []
    territory_by_id = {territory["id"]: territory for territory in config["territories"]}
    for habitat in config["habitats"]:
        for territory_id in habitat["territoryIds"]:
            habitat_records.append({"id": habitat["id"], "territory_id": territory_id, "substrates": ",".join(habitat["substrates"]), "elev_min": habitat["elevationMeters"][0], "elev_max": habitat["elevationMeters"][1], "slope_min": habitat["slopeDegrees"][0], "slope_max": habitat["slopeDegrees"][1], "moist_min": habitat["moisture"][0], "moist_max": habitat["moisture"][1], "corrupt_min": habitat["corruption"][0], "corrupt_max": habitat["corruption"][1]})
            habitat_geometry.append(Polygon(territory_by_id[territory_id]["polygon"]))
    layers.append(("habitat_domains", gpd.GeoDataFrame(habitat_records, geometry=habitat_geometry, crs=crs)))

    for index, (layer_name, frame) in enumerate(layers):
        frame.to_file(path, layer=layer_name, driver="GPKG", mode="w" if index == 0 else "a", index=False)
    with sqlite3.connect(path) as database:
        database.execute("UPDATE gpkg_contents SET last_change = '2000-01-01T00:00:00.000Z'")
        database.commit()
        database.execute("VACUUM")


def delta_arc(coordinates: list[list[float]]) -> list[list[int]]:
    quantized = [[round(point[0]), round(point[1])] for point in coordinates]
    result: list[list[int]] = []
    previous_x = previous_y = 0
    for index, (x, y) in enumerate(quantized):
        result.append([x, y] if index == 0 else [x - previous_x, y - previous_y])
        previous_x, previous_y = x, y
    return result


def write_topojson(path: Path, config: dict[str, Any], routes: list[dict[str, Any]], streams: list[dict[str, Any]], bridges: list[dict[str, Any]]) -> None:
    arcs: list[list[list[int]]] = []
    objects: dict[str, Any] = {}

    territory_geometries = []
    for territory in config["territories"]:
        ring = [*territory["polygon"], territory["polygon"][0]]
        arc_index = len(arcs)
        arcs.append(delta_arc(ring))
        territory_geometries.append({"type": "Polygon", "id": territory["id"], "properties": {"name": territory["name"], "code": territory["code"], "substrate": territory["substrate"]}, "arcs": [[arc_index]]})
    objects["territories"] = {"type": "GeometryCollection", "geometries": territory_geometries}

    route_geometries = []
    for route in routes:
        for section in route["sections"]:
            arc_index = len(arcs)
            arcs.append(delta_arc(section["coordinates"]))
            route_geometries.append({"type": "LineString", "id": section["id"], "properties": {"routeId": route["id"], "name": route["name"], "class": route["class"], "walkingSeconds": section["walkingSeconds"]}, "arcs": [arc_index]})
    objects["routes"] = {"type": "GeometryCollection", "geometries": route_geometries}

    stream_geometries = []
    for stream in streams:
        arc_index = len(arcs)
        arcs.append(delta_arc(stream["coordinates"]))
        stream_geometries.append({"type": "LineString", "id": stream["id"], "properties": {"name": stream["name"], "terminalId": stream["terminalId"]}, "arcs": [arc_index]})
    objects["streams"] = {"type": "GeometryCollection", "geometries": stream_geometries}

    objects["bridges"] = {"type": "GeometryCollection", "geometries": [
        {"type": "Point", "id": bridge["id"], "properties": {"routeSectionId": bridge["routeSectionId"], "streamId": bridge["streamId"], "status": bridge["status"]}, "coordinates": [round(bridge["coordinate"][0]), round(bridge["coordinate"][1])]}
        for bridge in bridges
    ]}

    sites = []
    for site in config["sites"]:
        sites.append({"type": "Point", "id": site["id"], "properties": {"name": site["name"], "kind": site["kind"], "territoryId": site["territoryId"]}, "coordinates": [round(site["coordinate"][0]), round(site["coordinate"][1])]})
    objects["sites"] = {"type": "GeometryCollection", "geometries": sites}
    topology = {"type": "Topology", "bbox": config["extent"], "transform": {"scale": [1, 1], "translate": [0, 0]}, "objects": objects, "arcs": arcs, "metadata": {"crs": "veyl_local_grid_v1", "classification": "fictional_modeled_not_measured", "generator": GENERATOR_VERSION}}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical_bytes(topology) + b"\n")


def write_artifacts(config: dict[str, Any], terrain: Terrain, routes: list[dict[str, Any]], streams: list[dict[str, Any]], bridges: list[dict[str, Any]]) -> None:
    from PIL import Image

    write_geotiff(SOURCE_ARTIFACT_DIRECTORY / "dtm-raw.tif", [terrain.raw], ["dtm_raw"], config, "float32", "average")
    write_geotiff(SOURCE_ARTIFACT_DIRECTORY / "dtm-conditioned.tif", [terrain.conditioned], ["dtm_conditioned"], config, "float32", "average")
    write_geotiff(
        SOURCE_ARTIFACT_DIRECTORY / "terrain-derivatives.tif",
        [terrain.slope, terrain.aspect, terrain.curvature, terrain.tpi, terrain.ruggedness, terrain.wetness, terrain.hillshade],
        ["slope_degrees", "aspect_degrees", "curvature_laplacian", "tpi_3x3", "ruggedness_tri", "mfd_wetness", "hillshade_multidirectional"],
        config, "float32", "average",
    )
    write_geotiff(
        SOURCE_ARTIFACT_DIRECTORY / "hydrology-derivatives.tif",
        [terrain.d8_direction.astype(np.uint32), terrain.d8_accumulation, terrain.watershed.astype(np.uint32), terrain.stream_mask.astype(np.uint32)],
        ["d8_flow_direction", "d8_flow_accumulation", "d8_watershed", "stream_mask"],
        config, "uint32", "nearest",
    )
    write_geopackage(SOURCE_ARTIFACT_DIRECTORY / "sable-reach.gpkg", config, routes, streams, bridges)
    write_topojson(RUNTIME_ARTIFACT_DIRECTORY / "sable-reach.topo.json", config, routes, streams, bridges)
    hillshade_image = Image.fromarray(np.rint(np.clip(terrain.hillshade, 0, 1) * 255).astype(np.uint8), mode="L")
    hillshade_image.save(RUNTIME_ARTIFACT_DIRECTORY / "hillshade.webp", format="WEBP", lossless=True, method=6, exact=True)


def artifact_metadata() -> list[dict[str, Any]]:
    definitions = [
        (WKT_PATH, "engineering_crs", "WKT", ["veyl_local_grid_v1"]),
        (SOURCE_ARTIFACT_DIRECTORY / "dtm-raw.tif", "canonical_raw_terrain", "GeoTIFF", ["dtm_raw"]),
        (SOURCE_ARTIFACT_DIRECTORY / "dtm-conditioned.tif", "canonical_hydrology_surface", "GeoTIFF", ["dtm_conditioned"]),
        (SOURCE_ARTIFACT_DIRECTORY / "terrain-derivatives.tif", "canonical_terrain_derivatives", "multiband GeoTIFF", ["slope_degrees", "aspect_degrees", "curvature_laplacian", "tpi_3x3", "ruggedness_tri", "mfd_wetness", "hillshade_multidirectional"]),
        (SOURCE_ARTIFACT_DIRECTORY / "hydrology-derivatives.tif", "canonical_hydrology_derivatives", "multiband GeoTIFF", ["d8_flow_direction", "d8_flow_accumulation", "d8_watershed", "stream_mask"]),
        (SOURCE_ARTIFACT_DIRECTORY / "sable-reach.gpkg", "canonical_vector_source", "GeoPackage", ["territories", "sites", "routes", "streams", "bridges", "hydrology_terminals", "proof_locations", "habitat_domains"]),
        (RUNTIME_ARTIFACT_DIRECTORY / "sable-reach.topo.json", "runtime_vector_atlas", "TopoJSON", ["territories", "routes", "streams", "bridges", "sites"]),
        (RUNTIME_ARTIFACT_DIRECTORY / "hillshade.webp", "runtime_hillshade", "WebP", ["hillshade_multidirectional"]),
    ]
    result = []
    for path, role, format_name, layers in definitions:
        if not path.exists():
            raise FileNotFoundError(f"Missing generated atlas artifact {path.relative_to(ROOT)}")
        result.append({"path": path.relative_to(ROOT).as_posix(), "role": role, "format": format_name, "status": "committed", "bytes": path.stat().st_size, "sha256": sha256_bytes(path.read_bytes()), "layers": layers})
    return result


def validate_artifacts(runtime: dict[str, Any], terrain: Terrain, config: dict[str, Any]) -> list[str]:
    import geopandas as gpd
    import rasterio
    from PIL import Image

    errors: list[str] = []
    artifacts = {artifact["role"]: artifact for artifact in runtime["artifacts"]}
    for artifact in runtime["artifacts"]:
        path = ROOT / artifact["path"]
        if not path.exists():
            errors.append(f"missing committed artifact {artifact['path']}")
        elif path.stat().st_size != artifact["bytes"] or sha256_bytes(path.read_bytes()) != artifact["sha256"]:
            errors.append(f"artifact hash/size mismatch {artifact['path']}")
    raster_expectations = [
        ("canonical_raw_terrain", [terrain.raw]),
        ("canonical_hydrology_surface", [terrain.conditioned]),
        ("canonical_terrain_derivatives", [terrain.slope, terrain.aspect, terrain.curvature, terrain.tpi, terrain.ruggedness, terrain.wetness, terrain.hillshade]),
        ("canonical_hydrology_derivatives", [terrain.d8_direction.astype(np.uint32), terrain.d8_accumulation, terrain.watershed.astype(np.uint32), terrain.stream_mask.astype(np.uint32)]),
    ]
    for role, arrays in raster_expectations:
        artifact = artifacts.get(role)
        if not artifact:
            errors.append(f"missing artifact role {role}")
            continue
        with rasterio.open(ROOT / artifact["path"]) as dataset:
            if (dataset.width, dataset.height, dataset.res[0], abs(dataset.res[1])) != (2048, 1536, 8, 8):
                errors.append(f"raster grid mismatch {artifact['path']}")
            if "Veyl Local Engineering Grid v1" not in dataset.crs.to_wkt():
                errors.append(f"raster CRS mismatch {artifact['path']}")
            if list(dataset.descriptions) != artifact["layers"]:
                errors.append(f"raster layer descriptions mismatch {artifact['path']}")
            for band, expected in enumerate(arrays, start=1):
                actual = dataset.read(band)
                if actual.dtype != expected.dtype or sha256_array(actual) != sha256_array(expected):
                    errors.append(f"raster pixels mismatch {artifact['path']} band {band}")
    gpkg = artifacts.get("canonical_vector_source")
    if gpkg:
        actual_layers = set(gpd.list_layers(ROOT / gpkg["path"])["name"].tolist())
        if actual_layers != set(gpkg["layers"]):
            errors.append(f"GeoPackage layer mismatch: {sorted(actual_layers)}")
        expected_counts = {"territories": 6, "sites": len(config["sites"]), "routes": sum(len(route["sections"]) for route in runtime["routes"]), "streams": len(runtime["hydrology"]["streams"]), "bridges": len(runtime["bridges"]), "hydrology_terminals": len(runtime["hydrology"]["terminals"]), "proof_locations": 7}
        for layer, count in expected_counts.items():
            if len(gpd.read_file(ROOT / gpkg["path"], layer=layer)) != count:
                errors.append(f"GeoPackage feature count mismatch {layer}")
    topo = artifacts.get("runtime_vector_atlas")
    if topo:
        topology = json.loads((ROOT / topo["path"]).read_text(encoding="utf-8"))
        if topology.get("type") != "Topology" or set(topology.get("objects", {})) != set(topo["layers"]):
            errors.append("runtime TopoJSON structure/layers mismatch")
        if topology.get("bbox") != config["extent"] or not topology.get("arcs"):
            errors.append("runtime TopoJSON extent/arcs missing")
    hillshade = artifacts.get("runtime_hillshade")
    if hillshade:
        with Image.open(ROOT / hillshade["path"]) as image:
            if image.size != (2048, 1536) or image.mode not in ("L", "RGB"):
                errors.append("runtime hillshade dimensions/mode mismatch")
    return errors


def build_runtime(config: dict[str, Any], *, export_artifacts: bool = False) -> tuple[dict[str, Any], Terrain]:
    terrain, mfd_metadata = build_terrain(config)
    streams = build_streams(config, terrain)
    routes, route_graph = build_routes(config, terrain)
    macro_cells, habitat_availability = build_macro_cells(config, terrain, routes)
    bridges = build_bridges(routes, streams)
    if export_artifacts:
        write_artifacts(config, terrain, routes, streams, bridges)
    wkt = WKT_PATH.read_bytes()
    source = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    proof_site_ids = {item["siteId"] for item in config["proofCells"]}
    sites = []
    for site in config["sites"]:
        actual_owner = territory_for_point(tuple(site["coordinate"][:2]), config["territories"])
        sites.append({**site, "containedByTerritoryId": actual_owner, "placementStatus": "atlas_placed", "productionStatus": "prototype_playable" if site["id"] in proof_site_ids else "world_data_only"})
    proof_cells = [{**item, "status": "prototype_playable"} for item in config["proofCells"]]
    terminal_cell_evidence = []
    for watershed_index, (terminal_id, cell) in enumerate(zip(terrain.terminal_ids, terrain.terminal_cells)):
        row, column = cell
        terminal_cell_evidence.append({
            "terminalId": terminal_id,
            "row": row,
            "column": column,
            "coordinate": [rounded((column + 0.5) * config["grid"]["cellSizeMeters"], 2), rounded(config["extent"][3] - (row + 0.5) * config["grid"]["cellSizeMeters"], 2)],
            "terrainDerivedCatchmentCellCount": int(np.count_nonzero(terrain.watershed == watershed_index)),
            "rawTerminalElevationMeters": rounded(terrain.raw[row, column], 6),
            "conditionedTerminalElevationMeters": rounded(terrain.conditioned[row, column], 6),
        })
    runtime = {
        "schemaVersion": 1,
        "id": "atlas.sable-reach.runtime.v1",
        "name": "Sable Reach GIS-valid modeled atlas",
        "classification": "fictional_modeled_not_measured",
        "maturity": {"atlas": "gis_valid", "hearthmere": "prototype_playable", "otherProofLocations": "prototype_playable", "seamlessTraversal": False, "productionTerrainAssets": False},
        "coordinateReferenceSystem": {"id": "veyl_local_grid_v1", "authorityCode": None, "type": "engineering", "axisOrder": ["easting", "northing", "elevation"], "horizontalUnits": "meters", "verticalUnits": "meters", "wkt": WKT_PATH.read_text(encoding="utf-8").strip(), "wktSha256": sha256_bytes(wkt)},
        "extent": {"minimumEasting": config["extent"][0], "minimumNorthing": config["extent"][1], "maximumEasting": config["extent"][2], "maximumNorthing": config["extent"][3], "widthMeters": config["extent"][2] - config["extent"][0], "heightMeters": config["extent"][3] - config["extent"][1]},
        "terrainGrid": {**config["grid"], "sampleLocation": "cell_center", "registration": "upper_left", "rowDirection": "north_to_south", "surfaceDefinition": "fictional bare-earth DTM excluding buildings and vegetation", "verticalDatum": "fictional local mean-water reference", "verticalAccuracy": None, "accuracyStatement": "Modeled terrain has no surveyed accuracy and is suitable only for game-world design."},
        "terrainLayers": terrain_layers(terrain, mfd_metadata),
        "hydrology": {"routing": {"basinsAndStreams": "D8", "wetness": "MFD", "mfd": mfd_metadata, "streamThresholdCells": 4000, "minimumContributingAreaSquareMeters": 256000}, "conditioningAudit": terrain.conditioning_audit, "terminals": config["hydrology"]["declaredOutlets"], "terminalCellIndices": terminal_cell_evidence, "streams": streams, "preservedDepressionIds": [item["id"] for item in config["hydrology"]["declaredOutlets"] if item["kind"] in ("pond", "closed_basin")]},
        "territories": config["territories"],
        "sites": sites,
        "routes": routes,
        "routeGraph": route_graph,
        "bridges": bridges,
        "habitats": config["habitats"],
        "habitatAvailability": habitat_availability,
        "macroCells": macro_cells,
        "hearthmereTransform": {"siteId": config["hearthmere"]["siteId"], "atlasOrigin": config["hearthmere"]["origin"], "localBoundsMeters": {"minimum": [0, 0, 0], "maximum": [config["hearthmere"]["localSizeMeters"][0], 0, config["hearthmere"]["localSizeMeters"][1]]}, "mapping": {"localX": "atlasEasting - 6400", "localY": "atlasElevation - 184", "localZ": "8320 - atlasNorthing", "inverseEasting": "6400 + localX", "inverseNorthing": "8320 - localZ", "inverseElevation": "184 + localY"}, "preservesExistingLocalCoordinates": True},
        "proofLocations": proof_cells,
        "familyShowcases": [{"familyId": family_id, "proofLocationId": proof_id, "encounterStatus": "prototype_contract_placed"} for family_id, proof_id in config["familyShowcases"]],
        "topologyRules": [
            {"id": "territories.cover.extent", "rule": "territory polygons exhaustively and exclusively cover the atlas extent", "toleranceMeters": 0.001},
            {"id": "sites.inside.territory", "rule": "each site is strictly inside its declared territory"},
            {"id": "routes.connected", "rule": "all settlement and proof-location sites participate in one bidirectional walking graph"},
            {"id": "streams.downhill", "rule": "each named modeled bed profile descends strictly to one declared terminal"},
            {"id": "bridges.cross.once", "rule": "declared bridge points must intersect one route section and one stream"},
        ],
        "artifacts": artifact_metadata(),
        "uncommittedAuthoringTargets": [item for item in source["canonicalOutputs"] if item["status"] != "committed"] + [item for item in source["runtimeOutputs"] if item["status"] != "committed"],
        "provenance": {"generatorId": GENERATOR_VERSION, "seed": config["seed"], "configPath": "tools/worldgen/config/worldgen.v1.json", "configSha256": sha256_bytes(CONFIG_PATH.read_bytes()), "sourceManifestSha256": sha256_bytes(SOURCE_PATH.read_bytes()), "wktPath": "tools/worldgen/crs/veyl_local_grid_v1.wkt", "wktSha256": sha256_bytes(wkt), "numpyVersion": np.__version__},
    }
    runtime["contentSha256"] = sha256_bytes(canonical_bytes(runtime))
    return runtime, terrain


def polygon_area(polygon: list[list[float]]) -> float:
    return abs(sum(polygon[index][0] * polygon[(index + 1) % len(polygon)][1] - polygon[(index + 1) % len(polygon)][0] * polygon[index][1] for index in range(len(polygon))) / 2)


def validate_runtime(runtime: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    extent = runtime["extent"]
    if (extent["widthMeters"], extent["heightMeters"]) != (16384, 12288):
        errors.append("atlas extent must be 16384 x 12288 meters")
    grid = runtime["terrainGrid"]
    if (grid["columns"], grid["rows"], grid["cellSizeMeters"]) != (2048, 1536, 8):
        errors.append("terrain grid must be 2048 x 1536 at 8 meters")
    if runtime["coordinateReferenceSystem"]["authorityCode"] is not None:
        errors.append("fictional engineering CRS must not claim an authority code")
    if sha256_bytes((runtime["coordinateReferenceSystem"]["wkt"] + "\n").encode("utf-8")) != runtime["coordinateReferenceSystem"]["wktSha256"]:
        errors.append("WKT hash does not resolve")
    territories = runtime["territories"]
    if len(territories) != 6:
        errors.append("six territories are required")
    atlas_area = extent["widthMeters"] * extent["heightMeters"]
    if abs(sum(polygon_area(item["polygon"]) for item in territories) - atlas_area) > 0.001:
        errors.append("territory polygon areas do not equal atlas extent")
    # Independent dense coverage/overlap check (64 m centers and offset probes).
    for northing in np.arange(32.0, extent["heightMeters"], 64.0):
        for easting in np.arange(32.0, extent["widthMeters"], 64.0):
            owners = [item["id"] for item in territories if point_in_polygon((float(easting), float(northing)), item["polygon"], False)]
            if len(owners) != 1:
                errors.append(f"territory coverage error at {easting},{northing}: {owners}")
                break
        if errors and errors[-1].startswith("territory coverage"):
            break
    for site in runtime["sites"]:
        if site["territoryId"] != site["containedByTerritoryId"]:
            errors.append(f"site {site['id']} is outside declared territory")
    graph = runtime["routeGraph"]
    adjacency = {node: set() for node in graph["nodes"]}
    for edge in graph["edges"]:
        adjacency[edge["from"]].add(edge["to"])
        if edge["bidirectional"]:
            adjacency[edge["to"]].add(edge["from"])
    required_nodes = {location["siteId"] for location in runtime["proofLocations"]}
    reached = set()
    pending = [next(iter(required_nodes))]
    while pending:
        node = pending.pop()
        if node in reached:
            continue
        reached.add(node)
        pending.extend(adjacency.get(node, set()) - reached)
    if not required_nodes <= reached:
        errors.append(f"proof-location route graph is disconnected: {sorted(required_nodes - reached)}")
    terminal_ids = {item["id"] for item in runtime["hydrology"]["terminals"]}
    for stream in runtime["hydrology"]["streams"]:
        elevations = stream["modeledBedElevationsMeters"]
        if stream["terminalId"] not in terminal_ids:
            errors.append(f"stream {stream['id']} has missing terminal")
        if any(a <= b for a, b in zip(elevations, elevations[1:])):
            errors.append(f"stream {stream['id']} does not descend strictly")
    macro = runtime["macroCells"]
    if macro["count"] != 768 or len(macro["records"]) != 768:
        errors.append("macro-cell manifest must contain 768 compact records")
    if sha256_bytes(canonical_bytes(macro["records"])) != macro["recordsSha256"]:
        errors.append("macro-cell collection hash is invalid")
    for record in macro["records"]:
        body, digest = record.rsplit("|", 1)
        if sha256_bytes(body.encode("utf-8")) != digest:
            errors.append(f"macro-cell record hash is invalid: {record[:24]}")
            break
    if len(runtime["terrainLayers"]) != 13 or any(len(item["sha256"]) != 64 for item in runtime["terrainLayers"]):
        errors.append("all thirteen terrain/hydrology derivatives require hashes")
    if len(runtime["proofLocations"]) != 7 or len(runtime["familyShowcases"]) != 21:
        errors.append("seven proof locations and 21 family showcases are required")
    record_by_id = {record.split("|", 1)[0]: record for record in runtime["macroCells"]["records"]}
    site_by_id = {site["id"]: site for site in runtime["sites"]}
    for proof in runtime["proofLocations"]:
        column, row = proof["macroCell"]
        site = site_by_id[proof["siteId"]]
        expected_column = int(site["coordinate"][0] // runtime["macroCells"]["cellSizeMeters"])
        expected_row = int(site["coordinate"][1] // runtime["macroCells"]["cellSizeMeters"])
        if [column, row] != [expected_column, expected_row]:
            errors.append(f"proof location {proof['id']} macro cell does not contain its site")
        cell_id = f"atlas.cell.r{row:02}.c{column:02}"
        fields = record_by_id[cell_id].split("|")
        if fields[-2] == "-":
            errors.append(f"proof location {proof['id']} has no habitat-valid macro cell")
    derivatives = runtime["macroCells"].get("alignedDerivatives", [])
    if {item["id"] for item in derivatives} != {"land_cover", "traversal_cost", "corruption", "habitat_suitability"} or any(len(item["sha256"]) != 64 for item in derivatives):
        errors.append("land cover, traversal cost, corruption, and habitat suitability require aligned hashes")
    weight_encoding = runtime["macroCells"].get("habitatWeightEncoding", {})
    if weight_encoding.get("kind") != "sparse_binary_membership" or weight_encoding.get("listedHabitatWeight") != 1 or weight_encoding.get("unlistedHabitatWeight") != 0:
        errors.append("habitat-cell suitability weights require explicit 0/1 sparse encoding")
    for route in runtime["routes"]:
        for section in route["sections"]:
            audit = section.get("leastCostAudit", {})
            if audit.get("algorithm") != "least_cost_raster_dijkstra_v1" or not audit.get("substratePenalties") or audit.get("analysisCellSizeMeters") != 128:
                errors.append(f"route section {section['id']} lacks slope/wetness/substrate/crossing least-cost evidence")
    if not runtime.get("bridges"):
        errors.append("route/stream topology requires modeled bridge features")
    for output in runtime["uncommittedAuthoringTargets"]:
        if output.get("status") == "committed":
            errors.append(f"unavailable authoring output falsely marked committed: {output['path']}")
    return errors


def validate_hydrology_and_crossings(runtime: dict[str, Any], terrain: Terrain) -> list[str]:
    from shapely.geometry import LineString, Point

    errors: list[str] = []
    rows, columns = terrain.raw.shape
    receiver = terrain.d8_receiver.ravel().astype(np.int64)
    direction = terrain.d8_direction.ravel()
    watershed = terrain.watershed.ravel()
    conditioned = terrain.conditioned.ravel()
    accumulation = terrain.d8_accumulation.ravel().astype(np.uint64)
    nonterminal = receiver >= 0
    if int(np.count_nonzero(~nonterminal)) != len(terrain.terminal_cells):
        errors.append("D8 terminal count differs from declared terminal count")
    if np.any(receiver[nonterminal] >= terrain.raw.size):
        errors.append("D8 receiver points outside the grid")
    indexes = np.flatnonzero(nonterminal)
    if np.any(watershed[indexes] != watershed[receiver[indexes]]):
        errors.append("D8 receiver crosses a watershed label")
    if np.any(conditioned[receiver[indexes]] >= conditioned[indexes]):
        errors.append("D8 receiver is not strictly downhill on conditioned terrain")
    offsets = {1: (0, 1), 2: (1, 1), 4: (1, 0), 8: (1, -1), 16: (0, -1), 32: (-1, -1), 64: (-1, 0), 128: (-1, 1)}
    flat_rows, flat_columns = np.divmod(indexes, columns)
    decoded = np.empty_like(indexes)
    for code, (dr, dc) in offsets.items():
        mask = direction[indexes] == code
        target_rows, target_columns = flat_rows[mask] + dr, flat_columns[mask] + dc
        if np.any((target_rows < 0) | (target_rows >= rows) | (target_columns < 0) | (target_columns >= columns)):
            errors.append(f"D8 code {code} points outside grid")
        decoded[mask] = target_rows * columns + target_columns
    if np.any(decoded != receiver[indexes]):
        errors.append("D8 direction codes do not resolve to stored receivers")
    terminal_flat = np.asarray([row * columns + column for row, column in terrain.terminal_cells])
    if int(accumulation[terminal_flat].sum()) != terrain.raw.size:
        errors.append(f"terminal accumulation sum {int(accumulation[terminal_flat].sum())} != {terrain.raw.size}")
    upstream = np.bincount(receiver[nonterminal], weights=accumulation[nonterminal], minlength=terrain.raw.size).astype(np.uint64)
    if np.any(accumulation != upstream + 1):
        errors.append("D8 accumulation violates upstream recurrence")
    audit = terrain.conditioning_audit
    gates = audit["gates"]
    if audit["meanAbsoluteDeltaMeters"] > gates["maximumMeanAbsoluteDeltaMeters"]:
        errors.append("terrain conditioning mean delta exceeds gate")
    if audit["p95AbsoluteDeltaMeters"] > gates["maximumP95AbsoluteDeltaMeters"] or audit["p99AbsoluteDeltaMeters"] > gates["maximumP99AbsoluteDeltaMeters"] or audit["maximumAbsoluteDeltaMeters"] > gates["maximumAbsoluteDeltaMeters"]:
        errors.append("terrain conditioning percentile delta exceeds gate")
    if audit["modifiedCellFraction"] > gates["maximumModifiedCellFraction"]:
        errors.append("terrain conditioning modified-cell fraction exceeds gate")
    if audit["rawConditionedCorrelation"] < gates["minimumRawConditionedCorrelation"] or audit["receiverRawDownhillFraction"] < gates["minimumReceiverRawDownhillFraction"]:
        errors.append("terrain-derived catchment fidelity gate failed")
    terminal_id_by_cell = {cell: terminal_id for cell, terminal_id in zip(terrain.terminal_cells, terrain.terminal_ids)}
    terminal_by_id = {terminal["id"]: terminal for terminal in runtime["hydrology"]["terminals"]}
    terminal_cell_evidence = runtime["hydrology"].get("terminalCellIndices", [])
    if {item["terminalId"] for item in terminal_cell_evidence} != set(terminal_by_id):
        errors.append("declared hydrology outlets and terrain-derived terminal labels do not resolve one-to-one")
    if len(terminal_cell_evidence) != len(terrain.terminal_cells):
        errors.append("runtime terminal-cell evidence count differs from terrain-derived terminals")
    for watershed_index, (terminal_id, (row, column)) in enumerate(zip(terrain.terminal_ids, terrain.terminal_cells)):
        if watershed_index >= len(terminal_cell_evidence):
            break
        evidence = terminal_cell_evidence[watershed_index]
        expected_coordinate = [rounded((column + 0.5) * runtime["terrainGrid"]["cellSizeMeters"], 2), rounded(runtime["extent"]["maximumNorthing"] - (row + 0.5) * runtime["terrainGrid"]["cellSizeMeters"], 2)]
        expected_count = int(np.count_nonzero(terrain.watershed == watershed_index))
        if evidence.get("terminalId") != terminal_id or evidence.get("row") != row or evidence.get("column") != column or evidence.get("coordinate") != expected_coordinate or evidence.get("terrainDerivedCatchmentCellCount") != expected_count:
            errors.append(f"terminal-cell evidence {watershed_index} does not match terrain-derived catchment")
        terminal = terminal_by_id.get(terminal_id)
        if not terminal:
            errors.append(f"terminal cell {watershed_index} uses undeclared outlet {terminal_id}")
            continue
        if terminal["kind"] in ("coast", "boundary"):
            side = terminal.get("boundarySide")
            on_declared_side = {"north": row == 0, "south": row == rows - 1, "west": column == 0, "east": column == columns - 1}.get(side, False)
            if not on_declared_side or (terminal["kind"] == "coast" and side != "west"):
                errors.append(f"terminal cell {watershed_index} violates {terminal_id} boundary-side semantics")
            along_distance = abs(expected_coordinate[1] - terminal["coordinate"][1]) if side in ("west", "east") else abs(expected_coordinate[0] - terminal["coordinate"][0])
            if along_distance > terminal.get("captureRadiusMeters", -1):
                errors.append(f"terminal cell {watershed_index} lies beyond {terminal_id} capture radius")
    for outlet in runtime["hydrology"]["terminals"]:
        if outlet["kind"] not in ("pond", "closed_basin"):
            continue
        cell = nearest_cell(outlet["coordinate"], runtime["extent"]["maximumNorthing"], runtime["terrainGrid"]["cellSizeMeters"], rows, columns)
        if terminal_id_by_cell.get(cell) != outlet["id"]:
            errors.append(f"preserved depression {outlet['id']} does not terminate at its declared pour cell")
    for stream in runtime["hydrology"]["streams"]:
        minimum_intersections = max(16, stream["d8TraceCellCount"] // 10)
        if stream["streamMaskIntersectionCells"] < minimum_intersections:
            errors.append(f"named stream {stream['id']} is not materially represented in stream_mask")
        if any(a <= b for a, b in zip(stream["modeledBedElevationsMeters"], stream["modeledBedElevationsMeters"][1:])):
            errors.append(f"named stream {stream['id']} conditioned profile is not downhill")
    sections = [(section["id"], LineString(section["coordinates"])) for route in runtime["routes"] for section in route["sections"]]
    streams = [(stream["id"], LineString(stream["coordinates"])) for stream in runtime["hydrology"]["streams"]]
    for bridge in runtime["bridges"]:
        point = Point(*bridge["coordinate"])
        touching_sections = [section_id for section_id, line in sections if line.distance(point) <= 0.001]
        touching_streams = [stream_id for stream_id, line in streams if line.distance(point) <= 0.001]
        if touching_sections != [bridge["routeSectionId"]] or touching_streams != [bridge["streamId"]]:
            errors.append(f"bridge {bridge['id']} does not intersect exactly its declared route and stream")
    return errors


def rendered_json(runtime: dict[str, Any]) -> str:
    return json.dumps(runtime, ensure_ascii=False, sort_keys=False, indent=2) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="write the canonical runtime manifest")
    parser.add_argument("--check", action="store_true", help="validate and prove committed output is reproducible")
    args = parser.parse_args()
    if not args.write and not args.check:
        parser.error("choose --write or --check")
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    runtime, terrain = build_runtime(config, export_artifacts=args.write)
    errors = [*validate_runtime(runtime), *validate_hydrology_and_crossings(runtime, terrain), *validate_artifacts(runtime, terrain, config)]
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    output = rendered_json(runtime)
    if args.write:
        RUNTIME_PATH.write_text(output, encoding="utf-8", newline="\n")
        print(f"wrote {RUNTIME_PATH.relative_to(ROOT)} ({len(output.encode('utf-8'))} bytes)")
    if args.check:
        if not RUNTIME_PATH.exists():
            print(f"ERROR: missing {RUNTIME_PATH.relative_to(ROOT)}", file=sys.stderr)
            return 1
        committed = RUNTIME_PATH.read_text(encoding="utf-8")
        if committed != output:
            print("ERROR: committed runtime atlas is stale; run generate.py --write", file=sys.stderr)
            return 1
        print(f"validated deterministic atlas {runtime['contentSha256']} with 768 cells, six territories, and 21 showcases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
