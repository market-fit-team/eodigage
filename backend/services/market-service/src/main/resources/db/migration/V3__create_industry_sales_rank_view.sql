-- 상권(행정동)별 업종 추정매출액 랭킹 뷰.
--
-- 각 (기준분기, 행정동) 안에서 업종을 추정매출액(thsmon_selng_amt) 내림차순으로 순위화한다.
-- 상권상세 리포트의 Top3 업종과 업종 필터(특정 업종이 Top3에 드는 상권 목록)가
-- 동일한 "추정매출 랭킹" 정의를 공유하도록 단일 소스로 둔다.
--
-- 일반 VIEW이므로 적재(market_industry_sales) 변경 시 자동으로 최신 값을 반영하며,
-- 갱신(refresh) 부담이 없다. 현재 데이터 규모(행정동 x 업종 x 분기 = 수만 행)에서는
-- 윈도우 함수 계산 비용이 작다. 호출이 잦아지거나 데이터가 커지면 동일 정의를
-- MATERIALIZED VIEW로 승격할 수 있다.
CREATE OR REPLACE VIEW market_industry_sales_rank AS
SELECT
    s.period_id,
    s.dong_id,
    s.industry_id,
    s.thsmon_selng_amt,
    s.thsmon_selng_co,
    RANK() OVER (
        PARTITION BY s.period_id, s.dong_id
        ORDER BY s.thsmon_selng_amt DESC NULLS LAST
    ) AS sales_amount_rank
FROM market_industry_sales s;
