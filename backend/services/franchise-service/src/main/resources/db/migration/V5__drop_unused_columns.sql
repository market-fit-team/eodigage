-- 사용하지 않는 컬럼 정리.
--  * franchise_brands.active / franchise_industries.active : 항상 TRUE, 코드에서 읽거나 쓰지 않음.
--  * franchise_ingest_batches.raw_response_ref : 항상 NULL, 기록하는 코드 없음.
--  * franchise_industries.industry_code : (induty_lclas_nm, induty_mlsfc_nm) 자연키와 중복.
--    업종 upsert를 자연키 충돌(ON CONFLICT) 기준으로 바꾸므로 해시 코드 컬럼을 제거한다.
--    (컬럼과 함께 UNIQUE(industry_code) 제약도 자동 제거됨)
ALTER TABLE franchise_brands         DROP COLUMN IF EXISTS active;
ALTER TABLE franchise_industries     DROP COLUMN IF EXISTS active;
ALTER TABLE franchise_ingest_batches DROP COLUMN IF EXISTS raw_response_ref;
ALTER TABLE franchise_industries     DROP COLUMN IF EXISTS industry_code;
