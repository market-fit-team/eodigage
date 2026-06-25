package com.eodigage.franchise.infrastructure.persistence.ingest;

import java.util.Map;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class FranchiseIngestJdbcRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public Long upsertDataSource(String sourceCode, String sourceName, String sourceUrl, String apiName) {
        String sql = """
                INSERT INTO franchise_data_sources (
                    source_code, source_name, provider, source_url, api_name, description
                )
                VALUES (
                    :sourceCode, :sourceName, '공정거래위원회', :sourceUrl, :apiName,
                    '공공데이터포털 가맹사업 공개정보 API'
                )
                ON CONFLICT (source_code) DO UPDATE SET
                    source_name = EXCLUDED.source_name,
                    source_url = EXCLUDED.source_url,
                    api_name = EXCLUDED.api_name,
                    updated_at = NOW()
                RETURNING id
                """;

        return jdbcTemplate.queryForObject(
                sql,
                new MapSqlParameterSource()
                        .addValue("sourceCode", sourceCode)
                        .addValue("sourceName", sourceName)
                        .addValue("sourceUrl", sourceUrl)
                        .addValue("apiName", apiName),
                Long.class
        );
    }

    public Long createIngestBatch(Long sourceId, String requestedPath, String requestParamsJson) {
        String sql = """
                INSERT INTO franchise_ingest_batches (
                    source_id, requested_path, request_params_json, result_code, result_message
                )
                VALUES (
                    :sourceId, :requestedPath, CAST(:requestParamsJson AS jsonb), 'STARTED', '적재 시작'
                )
                RETURNING id
                """;

        return jdbcTemplate.queryForObject(
                sql,
                new MapSqlParameterSource()
                        .addValue("sourceId", sourceId)
                        .addValue("requestedPath", requestedPath)
                        .addValue("requestParamsJson", requestParamsJson),
                Long.class
        );
    }

    public void finishIngestBatch(
            Long batchId,
            String resultCode,
            String resultMessage,
            Integer totalCount,
            Integer fetchedCount
    ) {
        String sql = """
                UPDATE franchise_ingest_batches
                SET result_code = :resultCode,
                    result_message = :resultMessage,
                    total_count = :totalCount,
                    fetched_count = :fetchedCount
                WHERE id = :batchId
                """;

        jdbcTemplate.update(
                sql,
                new MapSqlParameterSource()
                        .addValue("batchId", batchId)
                        .addValue("resultCode", resultCode)
                        .addValue("resultMessage", resultMessage)
                        .addValue("totalCount", totalCount)
                        .addValue("fetchedCount", fetchedCount)
        );
    }

    public void failIngestBatch(Long batchId, String resultCode, String resultMessage) {
        String sql = """
                UPDATE franchise_ingest_batches
                SET result_code = :resultCode,
                    result_message = :resultMessage
                WHERE id = :batchId
                """;

        jdbcTemplate.update(
                sql,
                new MapSqlParameterSource()
                        .addValue("batchId", batchId)
                        .addValue("resultCode", resultCode)
                        .addValue("resultMessage", truncate(resultMessage, 2000))
        );
    }

    public Long upsertIndustry(String indutyLclasNm, String indutyMlsfcNm) {
        String sql = """
                INSERT INTO franchise_industries (
                    induty_lclas_nm, induty_mlsfc_nm
                )
                VALUES (
                    :indutyLclasNm, :indutyMlsfcNm
                )
                ON CONFLICT (induty_lclas_nm, induty_mlsfc_nm) DO UPDATE SET
                    updated_at = NOW()
                RETURNING id
                """;

        return jdbcTemplate.queryForObject(
                sql,
                new MapSqlParameterSource()
                        .addValue("indutyLclasNm", indutyLclasNm)
                        .addValue("indutyMlsfcNm", indutyMlsfcNm),
                Long.class
        );
    }

    public Long upsertBrand(String brandCode, String brandName, String companyName, Long industryId) {
        String sql = """
                INSERT INTO franchise_brands (
                    brand_code, brand_name, company_name, primary_industry_id
                )
                VALUES (
                    :brandCode, :brandName, :companyName, :industryId
                )
                ON CONFLICT (brand_code) DO UPDATE SET
                    brand_name = EXCLUDED.brand_name,
                    company_name = EXCLUDED.company_name,
                    primary_industry_id = COALESCE(
                        franchise_brands.primary_industry_id,
                        EXCLUDED.primary_industry_id
                    ),
                    updated_at = NOW()
                RETURNING id
                """;

        return jdbcTemplate.queryForObject(
                sql,
                new MapSqlParameterSource()
                        .addValue("brandCode", brandCode)
                        .addValue("brandName", brandName)
                        .addValue("companyName", companyName)
                        .addValue("industryId", industryId),
                Long.class
        );
    }

    public void upsertStartupCost(
            Long brandId,
            Long sourceId,
            Long batchId,
            int baseYear,
            Map<String, String> item
    ) {
        String sql = """
                INSERT INTO franchise_startup_costs (
                    brand_id, source_id, ingest_batch_id, base_year,
                    jng_bzmn_jng_amt, jng_bzmn_edu_amt, jng_bzmn_etc_amt,
                    jng_bzmn_assrnc_amt, smtn_amt
                )
                VALUES (
                    :brandId, :sourceId, :batchId, :baseYear,
                    :jngAmt, :eduAmt, :etcAmt, :assrncAmt, :smtnAmt
                )
                ON CONFLICT (brand_id, base_year) DO UPDATE SET
                    source_id = EXCLUDED.source_id,
                    ingest_batch_id = EXCLUDED.ingest_batch_id,
                    jng_bzmn_jng_amt = EXCLUDED.jng_bzmn_jng_amt,
                    jng_bzmn_edu_amt = EXCLUDED.jng_bzmn_edu_amt,
                    jng_bzmn_etc_amt = EXCLUDED.jng_bzmn_etc_amt,
                    jng_bzmn_assrnc_amt = EXCLUDED.jng_bzmn_assrnc_amt,
                    smtn_amt = EXCLUDED.smtn_amt,
                    updated_at = NOW()
                """;

        jdbcTemplate.update(
                sql,
                new MapSqlParameterSource()
                        .addValue("brandId", brandId)
                        .addValue("sourceId", sourceId)
                        .addValue("batchId", batchId)
                        .addValue("baseYear", baseYear)
                        .addValue("jngAmt", longValue(item, "jngBzmnJngAmt"))
                        .addValue("eduAmt", longValue(item, "jngBzmnEduAmt"))
                        .addValue("etcAmt", longValue(item, "jngBzmnEtcAmt"))
                        .addValue("assrncAmt", longValue(item, "jngBzmnAssrncAmt"))
                        .addValue("smtnAmt", longValue(item, "smtnAmt"))
        );
    }

    public void upsertSalesStats(
            Long brandId,
            Long sourceId,
            Long batchId,
            int baseYear,
            Map<String, String> item
    ) {
        String sql = """
                INSERT INTO franchise_sales_stats (
                    brand_id, source_id, ingest_batch_id, base_year,
                    frcs_cnt, new_frcs_rgs_cnt, ctrt_end_cnt, ctrt_cncltn_cnt,
                    nm_chg_cnt, avrg_sls_amt, ar_unit_avrg_sls_amt
                )
                VALUES (
                    :brandId, :sourceId, :batchId, :baseYear,
                    :frcsCnt, :newFrcsRgsCnt, :ctrtEndCnt, :ctrtCncltnCnt,
                    :nmChgCnt, :avrgSlsAmt, :arUnitAvrgSlsAmt
                )
                ON CONFLICT (brand_id, base_year) DO UPDATE SET
                    source_id = EXCLUDED.source_id,
                    ingest_batch_id = EXCLUDED.ingest_batch_id,
                    frcs_cnt = EXCLUDED.frcs_cnt,
                    new_frcs_rgs_cnt = EXCLUDED.new_frcs_rgs_cnt,
                    ctrt_end_cnt = EXCLUDED.ctrt_end_cnt,
                    ctrt_cncltn_cnt = EXCLUDED.ctrt_cncltn_cnt,
                    nm_chg_cnt = EXCLUDED.nm_chg_cnt,
                    avrg_sls_amt = EXCLUDED.avrg_sls_amt,
                    ar_unit_avrg_sls_amt = EXCLUDED.ar_unit_avrg_sls_amt,
                    updated_at = NOW()
                """;

        jdbcTemplate.update(
                sql,
                new MapSqlParameterSource()
                        .addValue("brandId", brandId)
                        .addValue("sourceId", sourceId)
                        .addValue("batchId", batchId)
                        .addValue("baseYear", baseYear)
                        .addValue("frcsCnt", intValue(item, "frcsCnt"))
                        .addValue("newFrcsRgsCnt", intValue(item, "newFrcsRgsCnt"))
                        .addValue("ctrtEndCnt", intValue(item, "ctrtEndCnt"))
                        .addValue("ctrtCncltnCnt", intValue(item, "ctrtCncltnCnt"))
                        .addValue("nmChgCnt", intValue(item, "nmChgCnt"))
                        .addValue("avrgSlsAmt", longValue(item, "avrgSlsAmt"))
                        .addValue("arUnitAvrgSlsAmt", longValue(item, "arUnitAvrgSlsAmt"))
        );
    }

    public static Long longValue(Map<String, String> item, String key) {
        String normalized = normalizeNumber(item.get(key));
        if (normalized == null) {
            return null;
        }
        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    public static Integer intValue(Map<String, String> item, String key) {
        Long value = longValue(item, key);
        return value == null ? null : value.intValue();
    }

    private static String normalizeNumber(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().replace(",", "");
        if (trimmed.isEmpty() || "-".equals(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
