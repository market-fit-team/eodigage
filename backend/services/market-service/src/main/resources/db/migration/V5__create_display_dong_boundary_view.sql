-- 표시용(상권상세 리포트 기준) 행정동 경계 뷰.
--
-- 분석 데이터와 경계 데이터의 행정동이 분동/통합 시점 차이로 코드가 어긋나는 케이스를
-- 한곳에서 보정한다. 분동된 행정동(상일1동/상일2동)은 경계를 하나로 융합해 단일
-- 표시동(상일동)으로 노출하고, 코드만 다른 케이스(개포3동)는 표시명을 통일한다.
--
-- 이 뷰를 admin-area / market-search 가 공통으로 JOIN 하여 표시코드/명/중심좌표(/경계)를
-- 단일 소스에서 가져간다. (이전에는 동일 로직이 각 리포지토리 SQL에 복붙되어 있었다.)
CREATE VIEW market_display_dong_boundaries AS
SELECT
    display_code,
    display_name,
    sigungu_code,
    sigungu_name,
    base_date,
    boundary,
    ST_Y(ST_PointOnSurface(boundary))::numeric(10, 7) AS center_lat,
    ST_X(ST_PointOnSurface(boundary))::numeric(10, 7) AS center_lng
FROM (
    SELECT
        COALESCE(a.display_code, d.adm_dr_cd) AS display_code,
        COALESCE(a.display_name, d.adm_dr_nm) AS display_name,
        s.sigungu_cd AS sigungu_code,
        s.sigungu_nm AS sigungu_name,
        MAX(d.base_date) AS base_date,
        -- 표시동에 속한 경계행들을 하나의 폴리곤으로 융합(경계선 dissolve)
        ST_CollectionExtract(ST_UnaryUnion(ST_Collect(d.boundary)), 3) AS boundary
    FROM market_admin_dong_boundaries d
    LEFT JOIN (
        VALUES
            ('11680511', '11680511', '개포3동'),
            ('11740760', '11740520', '상일동'),
            ('11740770', '11740520', '상일동')
    ) AS a(boundary_dong_code, display_code, display_name)
        ON a.boundary_dong_code = d.adm_dr_cd
    LEFT JOIN market_admin_sigungu s ON s.id = d.sigungu_id
    WHERE d.boundary IS NOT NULL
    GROUP BY
        COALESCE(a.display_code, d.adm_dr_cd),
        COALESCE(a.display_name, d.adm_dr_nm),
        s.sigungu_cd,
        s.sigungu_nm
) merged
WHERE boundary IS NOT NULL
  AND NOT ST_IsEmpty(boundary);
