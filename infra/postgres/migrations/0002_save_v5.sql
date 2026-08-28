ALTER TABLE characters ADD COLUMN IF NOT EXISTS save_v5 jsonb;

-- Preserve every v4 transform value exactly while adding the named spatial
-- context required by schema v5. The legacy column remains available for
-- rollback and audit; new writes target save_v5 only.
UPDATE characters
SET save_v5 = jsonb_set(save_v4, '{version}', '5'::jsonb, true)
  || jsonb_build_object(
    'spatial', jsonb_build_object(
      'address', jsonb_build_object(
        'coordinateSpaceId', 'hearthmere_local_meters',
        'territoryId', 'territory.graven-march',
        'siteId', 'site.hearthmere',
        'macroCellId', 'atlas.cell.r16.c12'
      ),
      'siteTransform', jsonb_build_object(
        'siteId', 'site.hearthmere',
        'atlasCoordinateSpaceId', 'veyl_local_grid_v1',
        'localCoordinateSpaceId', 'hearthmere_local_meters',
        'atlasOrigin', jsonb_build_object('easting', 6400, 'northing', 8320, 'elevation', 184),
        'localAxes', jsonb_build_object('x', 'east', 'y', 'up', 'z', 'south')
      )
    )
  )
WHERE save_v4 IS NOT NULL AND save_v5 IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'characters_save_v5_schema') THEN
    ALTER TABLE characters
      ADD CONSTRAINT characters_save_v5_schema
      CHECK (save_v5 IS NULL OR (save_v5->>'version')::integer = 5);
  END IF;
END $$;
