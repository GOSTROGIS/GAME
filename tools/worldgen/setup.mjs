import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const worldgenDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentDirectory = path.join(worldgenDirectory, ".venv");
const localPython = process.platform === "win32"
  ? path.join(environmentDirectory, "Scripts", "python.exe")
  : path.join(environmentDirectory, "bin", "python");
const localPip = process.platform === "win32"
  ? path.join(environmentDirectory, "Scripts", "pip.exe")
  : path.join(environmentDirectory, "bin", "pip");

mkdirSync(worldgenDirectory, { recursive: true });
if (!existsSync(localPython)) {
  const candidates = process.env.SABLE_REACH_BOOTSTRAP_PYTHON
    ? [[process.env.SABLE_REACH_BOOTSTRAP_PYTHON, []]]
    : process.platform === "win32"
      ? [["py", ["-3.12"]], ["python", []]]
      : [["python3", []], ["python", []]];
  let bootstrap = null;
  for (const [command, prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, "-c", "import sys; assert sys.version_info >= (3, 12)"], { stdio: "ignore" });
    if (probe.status === 0) {
      bootstrap = { command, prefix };
      break;
    }
  }
  if (!bootstrap) {
    console.error("Python 3.12+ was not found. Set SABLE_REACH_BOOTSTRAP_PYTHON to an explicit interpreter.");
    process.exit(1);
  }
  const create = spawnSync(bootstrap.command, [...bootstrap.prefix, "-m", "venv", environmentDirectory], { stdio: "inherit" });
  if (create.status !== 0) process.exit(create.status ?? 1);
}

const install = spawnSync(localPip, [
  "install",
  "--disable-pip-version-check",
  "--requirement",
  path.join(worldgenDirectory, "requirements-gis.txt"),
], { cwd: worldgenDirectory, stdio: "inherit" });
if (install.status !== 0) process.exit(install.status ?? 1);

// The whitebox Python wrapper otherwise downloads unrelated demo rasters on
// first construction. Create its unused testdata directory before priming the
// executable, then pin the Windows binary used by local and CI worldgen.
const verify = spawnSync(localPython, ["-c", [
  "from pathlib import Path",
  "import hashlib, io, platform, shutil, tempfile, time, urllib.request, zipfile",
  "import geopandas, networkx, numpy, PIL, pyproj, rasterio, scipy, shapely, whitebox",
  "package_dir = Path(whitebox.__file__).resolve().parent",
  "(package_dir / 'testdata').mkdir(exist_ok=True)",
  "executable = package_dir / ('whitebox_tools.exe' if platform.system() == 'Windows' else 'whitebox_tools')",
  "expected_windows_digest = '1212c668f89048e3189b9ad73f2670e60f8cd4b7a976272fc27f502c5157c925'",
  "if platform.system() == 'Windows' and (not executable.is_file() or hashlib.sha256(executable.read_bytes()).hexdigest().lower() != expected_windows_digest):",
  "    archive_url = 'https://www.whiteboxgeo.com/WBT_Windows/WhiteboxTools_win_amd64.zip'",
  "    archive_digest = '2b39f0fc90f73b295467850bd470bfacd3dab34e84b8550c049d30b4f7600d6b'",
  "    payload = None",
  "    for attempt in range(4):",
  "        try:",
  "            with urllib.request.urlopen(archive_url, timeout=120) as response:",
  "                candidate = response.read()",
  "            if hashlib.sha256(candidate).hexdigest().lower() != archive_digest:",
  "                raise RuntimeError('WhiteboxTools archive hash mismatch')",
  "            payload = candidate",
  "            break",
  "        except Exception:",
  "            if attempt == 3:",
  "                raise",
  "            time.sleep(5 * (attempt + 1))",
  "    with tempfile.TemporaryDirectory(prefix='sable-whitebox-') as temporary:",
  "        extraction_root = Path(temporary).resolve()",
  "        with zipfile.ZipFile(io.BytesIO(payload)) as archive:",
  "            for member in archive.infolist():",
  "                target = (extraction_root / member.filename).resolve()",
  "                assert target == extraction_root or extraction_root in target.parents, f'Unsafe WhiteboxTools archive member: {member.filename}'",
  "            archive.extractall(extraction_root)",
  "        bundle = extraction_root / 'WhiteboxTools_win_amd64' / 'WBT'",
  "        assert bundle.is_dir(), f'WhiteboxTools bundle missing: {bundle}'",
  "        shutil.rmtree(package_dir / 'WBT', ignore_errors=True)",
  "        shutil.copytree(bundle, package_dir / 'WBT', dirs_exist_ok=True)",
  "        for directory_name in ('img', 'plugins'):",
  "            source = bundle / directory_name",
  "            if source.is_dir():",
  "                shutil.rmtree(package_dir / directory_name, ignore_errors=True)",
  "                shutil.copytree(source, package_dir / directory_name, dirs_exist_ok=True)",
  "        shutil.copy2(bundle / 'whitebox_tools.exe', executable)",
  "        runner = bundle / 'whitebox_runner.exe'",
  "        if runner.is_file():",
  "            shutil.copy2(runner, package_dir / runner.name)",
  "from whitebox import WhiteboxTools",
  "tool = WhiteboxTools()",
  "assert executable.is_file(), f'WhiteboxTools executable missing: {executable}'",
  "digest = hashlib.sha256(executable.read_bytes()).hexdigest().lower()",
  "assert platform.system() != 'Windows' or digest == expected_windows_digest, f'Unexpected WhiteboxTools Windows binary hash: {digest}'",
  "version = tool.version()",
  "assert 'WhiteboxTools v2.4.0' in version, f'Unexpected WhiteboxTools version: {version}'",
  "print(f'Sable Reach GIS environment ready; WhiteboxTools sha256={digest}')",
].join("\n")], { stdio: "inherit" });
process.exit(verify.status ?? 1);
