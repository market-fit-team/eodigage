ALTER TABLE market_admin_sigungu
    DROP COLUMN IF EXISTS object_id;

ALTER TABLE market_admin_dongs
    DROP COLUMN IF EXISTS object_id;

ALTER TABLE market_metric_periods
    DROP COLUMN IF EXISTS start_date,
    DROP COLUMN IF EXISTS end_date;

ALTER TABLE market_service_industries
    DROP COLUMN IF EXISTS parent_category;

ALTER TABLE market_floating_populations
    DROP COLUMN IF EXISTS raw_json;

ALTER TABLE market_resident_populations
    DROP COLUMN IF EXISTS raw_json;

ALTER TABLE market_industry_sales
    DROP COLUMN IF EXISTS raw_json;

ALTER TABLE market_industry_stores
    DROP COLUMN IF EXISTS raw_json;

ALTER TABLE market_trade_area_changes
    DROP COLUMN IF EXISTS display_label,
    DROP COLUMN IF EXISTS display_description,
    DROP COLUMN IF EXISTS raw_json;
