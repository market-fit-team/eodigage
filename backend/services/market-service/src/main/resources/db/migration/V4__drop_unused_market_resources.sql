DROP TABLE IF EXISTS market_analysis_snapshots;

ALTER TABLE market_admin_dongs
    DROP COLUMN IF EXISTS source_id,
    DROP COLUMN IF EXISTS ingest_batch_id;

ALTER TABLE market_ingest_batches
    DROP COLUMN IF EXISTS request_params_json,
    DROP COLUMN IF EXISTS list_total_count,
    DROP COLUMN IF EXISTS raw_response_ref;
