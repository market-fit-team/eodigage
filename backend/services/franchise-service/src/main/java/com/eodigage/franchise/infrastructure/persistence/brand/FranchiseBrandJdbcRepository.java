package com.eodigage.franchise.infrastructure.persistence.brand;

import java.util.List;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/**
 * 프랜차이즈 브랜드별 창업예상비용/추정매출 조회 리포지토리.
 *
 * <p>브랜드에 최신 기준연도(base_year)의 창업비용/매출통계를 LATERAL로 1건씩 붙이고,
 * 업종명은 상권분석 정본(market_svc_induty_cd_nm)으로 노출한다(미매핑이면 NULL → 화면 '기타').
 */
@Repository
@RequiredArgsConstructor
public class FranchiseBrandJdbcRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    /** 필터 조건에 해당하는 브랜드 총 개수(페이징용). */
    public long countBrands(String marketIndustryCode, String keyword) {
        String sql = """
                SELECT count(*)
                FROM franchise_brands b
                LEFT JOIN franchise_industries i ON i.id = b.primary_industry_id
                WHERE (CAST(:industryCode AS varchar) IS NULL OR i.market_svc_induty_cd = :industryCode)
                  AND (CAST(:keyword AS varchar) IS NULL OR b.brand_name LIKE '%' || :keyword || '%')
                """;
        Long count = jdbcTemplate.queryForObject(
                sql,
                new MapSqlParameterSource()
                        .addValue("industryCode", marketIndustryCode)
                        .addValue("keyword", keyword),
                Long.class
        );
        return count == null ? 0L : count;
    }

    /**
     * 브랜드별 창업비용/매출 1페이지 조회.
     *
     * @param marketIndustryCode 상권분석 업종코드(svc_induty_cd) 필터, null이면 전체
     * @param keyword 브랜드명 부분일치 필터, null이면 전체
     */
    public List<FranchiseBrandRow> findBrands(String marketIndustryCode, String keyword, int size, long offset) {
        String sql = """
                SELECT b.brand_code,
                       b.brand_name,
                       b.company_name,
                       i.induty_mlsfc_nm        AS ftc_industry_name,
                       i.market_svc_induty_cd_nm AS market_industry_name,
                       COALESCE(ss.base_year, sc.base_year) AS base_year,
                       sc.smtn_amt,
                       sc.jng_bzmn_jng_amt,
                       sc.jng_bzmn_edu_amt,
                       sc.jng_bzmn_etc_amt,
                       sc.jng_bzmn_assrnc_amt,
                       ss.avrg_sls_amt,
                       ss.ar_unit_avrg_sls_amt,
                       ss.frcs_cnt
                FROM franchise_brands b
                LEFT JOIN franchise_industries i ON i.id = b.primary_industry_id
                LEFT JOIN LATERAL (
                    SELECT base_year, smtn_amt, jng_bzmn_jng_amt, jng_bzmn_edu_amt,
                           jng_bzmn_etc_amt, jng_bzmn_assrnc_amt
                    FROM franchise_startup_costs c
                    WHERE c.brand_id = b.id
                    ORDER BY base_year DESC
                    LIMIT 1
                ) sc ON true
                LEFT JOIN LATERAL (
                    SELECT base_year, avrg_sls_amt, ar_unit_avrg_sls_amt, frcs_cnt
                    FROM franchise_sales_stats s
                    WHERE s.brand_id = b.id
                    ORDER BY base_year DESC
                    LIMIT 1
                ) ss ON true
                WHERE (CAST(:industryCode AS varchar) IS NULL OR i.market_svc_induty_cd = :industryCode)
                  AND (CAST(:keyword AS varchar) IS NULL OR b.brand_name LIKE '%' || :keyword || '%')
                ORDER BY b.brand_name, b.brand_code
                LIMIT :size OFFSET :offset
                """;
        return jdbcTemplate.query(
                sql,
                new MapSqlParameterSource()
                        .addValue("industryCode", marketIndustryCode)
                        .addValue("keyword", keyword)
                        .addValue("size", size)
                        .addValue("offset", offset),
                rowMapper()
        );
    }

    private RowMapper<FranchiseBrandRow> rowMapper() {
        return (rs, rowNum) -> new FranchiseBrandRow(
                rs.getString("brand_code"),
                rs.getString("brand_name"),
                rs.getString("company_name"),
                rs.getString("ftc_industry_name"),
                rs.getString("market_industry_name"),
                (Integer) rs.getObject("base_year"),
                (Long) rs.getObject("smtn_amt"),
                (Long) rs.getObject("jng_bzmn_jng_amt"),
                (Long) rs.getObject("jng_bzmn_edu_amt"),
                (Long) rs.getObject("jng_bzmn_etc_amt"),
                (Long) rs.getObject("jng_bzmn_assrnc_amt"),
                (Long) rs.getObject("avrg_sls_amt"),
                (Long) rs.getObject("ar_unit_avrg_sls_amt"),
                (Integer) rs.getObject("frcs_cnt")
        );
    }

    /** 조회 결과 1행(원천 컬럼 그대로). 표시 가공은 application 레이어에서 한다. */
    public record FranchiseBrandRow(
            String brandCode,
            String brandName,
            String companyName,
            String ftcIndustryName,
            String marketIndustryName,
            Integer baseYear,
            Long startupTotalAmount,
            Long franchiseFeeAmount,
            Long educationFeeAmount,
            Long etcAmount,
            Long depositAmount,
            Long averageSalesAmount,
            Long areaUnitAverageSalesAmount,
            Integer franchiseCount
    ) {
    }
}
