CREATE TABLE IF NOT EXISTS market_data_sources (
    id BIGSERIAL PRIMARY KEY,
    source_code VARCHAR(100) NOT NULL UNIQUE,
    source_name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    source_url TEXT NOT NULL,
    api_name VARCHAR(150),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ingest_batches (
    id BIGSERIAL PRIMARY KEY,
    source_id BIGINT NOT NULL REFERENCES market_data_sources(id) ON DELETE CASCADE,
    requested_path TEXT,
    request_params_json JSONB,
    result_code VARCHAR(50),
    result_message TEXT,
    list_total_count INTEGER,
    fetched_count INTEGER,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
    raw_response_ref TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_metric_periods (
    id BIGSERIAL PRIMARY KEY,
    period_key VARCHAR(20) NOT NULL UNIQUE,
    stdr_yyqu_cd VARCHAR(20) NOT NULL UNIQUE,
    year INTEGER,
    quarter INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_admin_sigungu (
    id BIGSERIAL PRIMARY KEY,
    base_date VARCHAR(8) NOT NULL,
    sigungu_cd VARCHAR(5) NOT NULL UNIQUE,
    sigungu_nm VARCHAR(50) NOT NULL,
    sido VARCHAR(50) NOT NULL DEFAULT 'Seoul',
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    center_lat NUMERIC(10,7),
    center_lng NUMERIC(10,7),
    boundary_geojson JSONB,
    boundary GEOMETRY(MULTIPOLYGON, 4326),
    boundary_simplified_geojson JSONB,
    center_point GEOMETRY(POINT, 4326),
    raw_properties_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_admin_dongs (
    id BIGSERIAL PRIMARY KEY,
    base_date VARCHAR(8) NOT NULL,
    adm_dr_cd VARCHAR(8) NOT NULL UNIQUE,
    adm_dr_nm VARCHAR(50) NOT NULL,
    sigungu_id BIGINT REFERENCES market_admin_sigungu(id) ON DELETE SET NULL,
    sido VARCHAR(50) NOT NULL DEFAULT 'Seoul',
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_admin_dong_boundaries (
    id BIGSERIAL PRIMARY KEY,
    base_date VARCHAR(8) NOT NULL,
    adm_dr_cd VARCHAR(8) NOT NULL UNIQUE,
    adm_dr_nm VARCHAR(50) NOT NULL,
    sigungu_id BIGINT REFERENCES market_admin_sigungu(id) ON DELETE SET NULL,
    sido VARCHAR(50) NOT NULL DEFAULT 'Seoul',
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    center_lat NUMERIC(10,7),
    center_lng NUMERIC(10,7),
    boundary_geojson JSONB,
    boundary GEOMETRY(MULTIPOLYGON, 4326),
    boundary_simplified_geojson JSONB,
    center_point GEOMETRY(POINT, 4326),
    raw_properties_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_service_industries (
    id BIGSERIAL PRIMARY KEY,
    svc_induty_cd VARCHAR(50) NOT NULL UNIQUE,
    svc_induty_cd_nm VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_floating_populations (
    id BIGSERIAL PRIMARY KEY,
    period_id BIGINT NOT NULL REFERENCES market_metric_periods(id) ON DELETE CASCADE,
    dong_id BIGINT NOT NULL REFERENCES market_admin_dongs(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    tot_flpop_co BIGINT,
    ml_flpop_co BIGINT,
    fml_flpop_co BIGINT,
    agrde_10_flpop_co BIGINT,
    agrde_20_flpop_co BIGINT,
    agrde_30_flpop_co BIGINT,
    agrde_40_flpop_co BIGINT,
    agrde_50_flpop_co BIGINT,
    agrde_60_above_flpop_co BIGINT,
    tmzon_00_06_flpop_co BIGINT,
    tmzon_06_11_flpop_co BIGINT,
    tmzon_11_14_flpop_co BIGINT,
    tmzon_14_17_flpop_co BIGINT,
    tmzon_17_21_flpop_co BIGINT,
    tmzon_21_24_flpop_co BIGINT,
    mon_flpop_co BIGINT,
    tues_flpop_co BIGINT,
    wed_flpop_co BIGINT,
    thur_flpop_co BIGINT,
    fri_flpop_co BIGINT,
    sat_flpop_co BIGINT,
    sun_flpop_co BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, dong_id)
);

CREATE TABLE IF NOT EXISTS market_resident_populations (
    id BIGSERIAL PRIMARY KEY,
    period_id BIGINT NOT NULL REFERENCES market_metric_periods(id) ON DELETE CASCADE,
    dong_id BIGINT NOT NULL REFERENCES market_admin_dongs(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    tot_repop_co BIGINT,
    ml_repop_co BIGINT,
    fml_repop_co BIGINT,
    agrde_10_repop_co BIGINT,
    agrde_20_repop_co BIGINT,
    agrde_30_repop_co BIGINT,
    agrde_40_repop_co BIGINT,
    agrde_50_repop_co BIGINT,
    agrde_60_above_repop_co BIGINT,
    mag_10_repop_co BIGINT,
    mag_20_repop_co BIGINT,
    mag_30_repop_co BIGINT,
    mag_40_repop_co BIGINT,
    mag_50_repop_co BIGINT,
    mag_60_above_repop_co BIGINT,
    fag_10_repop_co BIGINT,
    fag_20_repop_co BIGINT,
    fag_30_repop_co BIGINT,
    fag_40_repop_co BIGINT,
    fag_50_repop_co BIGINT,
    fag_60_above_repop_co BIGINT,
    tot_hshld_co BIGINT,
    apt_hshld_co BIGINT,
    non_apt_hshld_co BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, dong_id)
);

CREATE TABLE IF NOT EXISTS market_industry_sales (
    id BIGSERIAL PRIMARY KEY,
    period_id BIGINT NOT NULL REFERENCES market_metric_periods(id) ON DELETE CASCADE,
    dong_id BIGINT NOT NULL REFERENCES market_admin_dongs(id) ON DELETE CASCADE,
    industry_id BIGINT NOT NULL REFERENCES market_service_industries(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    thsmon_selng_amt BIGINT,
    thsmon_selng_co BIGINT,
    mdwk_selng_amt BIGINT,
    wkend_selng_amt BIGINT,
    mon_selng_amt BIGINT,
    tues_selng_amt BIGINT,
    wed_selng_amt BIGINT,
    thur_selng_amt BIGINT,
    fri_selng_amt BIGINT,
    sat_selng_amt BIGINT,
    sun_selng_amt BIGINT,
    tmzon_00_06_selng_amt BIGINT,
    tmzon_06_11_selng_amt BIGINT,
    tmzon_11_14_selng_amt BIGINT,
    tmzon_14_17_selng_amt BIGINT,
    tmzon_17_21_selng_amt BIGINT,
    tmzon_21_24_selng_amt BIGINT,
    ml_selng_amt BIGINT,
    fml_selng_amt BIGINT,
    agrde_10_selng_amt BIGINT,
    agrde_20_selng_amt BIGINT,
    agrde_30_selng_amt BIGINT,
    agrde_40_selng_amt BIGINT,
    agrde_50_selng_amt BIGINT,
    agrde_60_above_selng_amt BIGINT,
    mdwk_selng_co BIGINT,
    wkend_selng_co BIGINT,
    mon_selng_co BIGINT,
    tues_selng_co BIGINT,
    wed_selng_co BIGINT,
    thur_selng_co BIGINT,
    fri_selng_co BIGINT,
    sat_selng_co BIGINT,
    sun_selng_co BIGINT,
    tmzon_00_06_selng_co BIGINT,
    tmzon_06_11_selng_co BIGINT,
    tmzon_11_14_selng_co BIGINT,
    tmzon_14_17_selng_co BIGINT,
    tmzon_17_21_selng_co BIGINT,
    tmzon_21_24_selng_co BIGINT,
    ml_selng_co BIGINT,
    fml_selng_co BIGINT,
    agrde_10_selng_co BIGINT,
    agrde_20_selng_co BIGINT,
    agrde_30_selng_co BIGINT,
    agrde_40_selng_co BIGINT,
    agrde_50_selng_co BIGINT,
    agrde_60_above_selng_co BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, dong_id, industry_id)
);

CREATE TABLE IF NOT EXISTS market_industry_stores (
    id BIGSERIAL PRIMARY KEY,
    period_id BIGINT NOT NULL REFERENCES market_metric_periods(id) ON DELETE CASCADE,
    dong_id BIGINT NOT NULL REFERENCES market_admin_dongs(id) ON DELETE CASCADE,
    industry_id BIGINT NOT NULL REFERENCES market_service_industries(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    similr_induty_stor_co BIGINT,
    stor_co BIGINT,
    frc_stor_co BIGINT,
    opbiz_rt NUMERIC(8,3),
    opbiz_stor_co BIGINT,
    clsbiz_rt NUMERIC(8,3),
    clsbiz_stor_co BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, dong_id, industry_id)
);

CREATE TABLE IF NOT EXISTS market_trade_area_changes (
    id BIGSERIAL PRIMARY KEY,
    period_id BIGINT NOT NULL REFERENCES market_metric_periods(id) ON DELETE CASCADE,
    dong_id BIGINT NOT NULL REFERENCES market_admin_dongs(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES market_data_sources(id) ON DELETE SET NULL,
    ingest_batch_id BIGINT REFERENCES market_ingest_batches(id) ON DELETE SET NULL,
    trdar_chnge_ix VARCHAR(10),
    trdar_chnge_ix_nm VARCHAR(100),
    opr_sale_mt_avrg NUMERIC(10,2),
    cls_sale_mt_avrg NUMERIC(10,2),
    su_opr_sale_mt_avrg NUMERIC(10,2),
    su_cls_sale_mt_avrg NUMERIC(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, dong_id)
);

CREATE TABLE IF NOT EXISTS market_analysis_snapshots (
    id BIGSERIAL PRIMARY KEY,
    dong_id BIGINT NOT NULL REFERENCES market_admin_dongs(id) ON DELETE CASCADE,
    period_id BIGINT NOT NULL REFERENCES market_metric_periods(id) ON DELETE CASCADE,
    preview_json JSONB,
    detail_json JSONB,
    data_quality_json JSONB,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (dong_id, period_id)
);

CREATE INDEX IF NOT EXISTS idx_market_admin_sigungu_boundary
    ON market_admin_sigungu USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_market_admin_dongs_sigungu
    ON market_admin_dongs (sigungu_id);
CREATE INDEX IF NOT EXISTS idx_market_admin_dong_boundaries_sigungu
    ON market_admin_dong_boundaries (sigungu_id);
CREATE INDEX IF NOT EXISTS idx_market_admin_dong_boundaries_boundary
    ON market_admin_dong_boundaries USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_market_floating_populations_dong_period
    ON market_floating_populations (dong_id, period_id);
CREATE INDEX IF NOT EXISTS idx_market_resident_populations_dong_period
    ON market_resident_populations (dong_id, period_id);
CREATE INDEX IF NOT EXISTS idx_market_industry_sales_dong_period
    ON market_industry_sales (dong_id, period_id);
CREATE INDEX IF NOT EXISTS idx_market_industry_sales_industry_period
    ON market_industry_sales (industry_id, period_id);
CREATE INDEX IF NOT EXISTS idx_market_industry_stores_dong_period
    ON market_industry_stores (dong_id, period_id);
CREATE INDEX IF NOT EXISTS idx_market_trade_area_changes_dong_period
    ON market_trade_area_changes (dong_id, period_id);
