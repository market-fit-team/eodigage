package com.eodigage.market.infrastructure.persistence.adminarea;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class MarketAdminAreaJdbcRepository {

    private static final String GEOMETRY_JSON =
            "COALESCE(boundary_simplified_geojson, boundary_geojson)::text AS geometry_json";

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public List<AdminAreaBoundaryRow> findSigunguBoundaries() {
        String sql = """
                SELECT 'sigungu' AS area_type,
                       sigungu_cd AS code,
                       sigungu_nm AS name,
                       sigungu_cd AS sigungu_code,
                       sigungu_nm AS sigungu_name,
                       base_date,
                       center_lat,
                       center_lng,
                       %s
                FROM market_admin_sigungu
                ORDER BY sigungu_cd
                """.formatted(GEOMETRY_JSON);

        return jdbcTemplate.query(sql, new MapSqlParameterSource(), boundaryRowMapper());
    }

    public List<AdminAreaBoundaryRow> findDongBoundaries(String sigunguCode) {
        String sql = """
                SELECT 'dong' AS area_type,
                       display_code AS code,
                       display_name AS name,
                       sigungu_code,
                       sigungu_name,
                       base_date,
                       center_lat,
                       center_lng,
                       ST_AsGeoJSON(
                           ST_SimplifyPreserveTopology(boundary, 0.0005)
                       )::text AS geometry_json
                FROM market_display_dong_boundaries
                WHERE (
                    CAST(:sigunguCode AS varchar) IS NULL
                    OR sigungu_code = CAST(:sigunguCode AS varchar)
                )
                ORDER BY sigungu_code NULLS LAST, code
                """;

        return jdbcTemplate.query(
                sql,
                new MapSqlParameterSource("sigunguCode", blankToNull(sigunguCode)),
                boundaryRowMapper()
        );
    }

    private RowMapper<AdminAreaBoundaryRow> boundaryRowMapper() {
        return (rs, rowNum) -> new AdminAreaBoundaryRow(
                rs.getString("area_type"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("sigungu_code"),
                rs.getString("sigungu_name"),
                rs.getString("base_date"),
                rs.getBigDecimal("center_lat"),
                rs.getBigDecimal("center_lng"),
                rs.getString("geometry_json")
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    public record AdminAreaBoundaryRow(
            String areaType,
            String code,
            String name,
            String sigunguCode,
            String sigunguName,
            String baseDate,
            BigDecimal centerLat,
            BigDecimal centerLng,
            String geometryJson
    ) {
    }
}
