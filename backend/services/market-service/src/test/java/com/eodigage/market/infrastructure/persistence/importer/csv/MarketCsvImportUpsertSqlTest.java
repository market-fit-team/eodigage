package com.eodigage.market.infrastructure.persistence.importer.csv;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

/**
 * upsert SQL 자동생성({@code buildUpsert})이 바인딩 파라미터와 정확히 맞물리는지 DB 없이 검증한다.
 *
 * <p>- 생성된 SQL의 모든 {@code :플레이스홀더}가 실제로 바인딩된 파라미터로 채워지는지
 * <p>- INSERT 대상 모든 값 컬럼이 {@code ON CONFLICT DO UPDATE SET}에도 빠짐없이 들어가는지
 *   (충돌 키 컬럼 제외) — 재적재 시 일부 컬럼만 갱신되는 정합성 버그를 구조적으로 차단한다.
 */
class MarketCsvImportUpsertSqlTest {

    private static final Pattern PLACEHOLDER = Pattern.compile(":([a-zA-Z][a-zA-Z0-9]*)");
    private static final Pattern INSERT_COLUMNS = Pattern.compile("INSERT INTO \\S+ \\(([^)]*)\\)");
    private static final Pattern CONFLICT_COLUMNS = Pattern.compile("ON CONFLICT \\(([^)]*)\\)");

    private final NamedParameterJdbcTemplate jdbcTemplate = Mockito.mock(NamedParameterJdbcTemplate.class);
    private final MarketCsvImportJdbcRepository repository = new MarketCsvImportJdbcRepository(jdbcTemplate);

    @Test
    void 유동인구_upsert는_플레이스홀더와_SET컬럼이_일치한다() {
        repository.upsertFloatingPopulation(1L, 2L, 3L, 4L, new HashMap<>());
        assertUpsertIsConsistent();
    }

    @Test
    void 상주인구_upsert는_플레이스홀더와_SET컬럼이_일치한다() {
        repository.upsertResidentPopulation(1L, 2L, 3L, 4L, new HashMap<>());
        assertUpsertIsConsistent();
    }

    @Test
    void 업종매출_upsert는_플레이스홀더와_SET컬럼이_일치한다() {
        repository.upsertIndustrySales(1L, 2L, 9L, 3L, 4L, new HashMap<>());
        assertUpsertIsConsistent();
    }

    @Test
    void 업종점포_upsert는_플레이스홀더와_SET컬럼이_일치한다() {
        repository.upsertIndustryStores(1L, 2L, 9L, 3L, 4L, new HashMap<>());
        assertUpsertIsConsistent();
    }

    @Test
    void 상권변화_upsert는_플레이스홀더와_SET컬럼이_일치한다() {
        repository.upsertTradeAreaChange(1L, 2L, 3L, 4L, new HashMap<>());
        assertUpsertIsConsistent();
    }

    /** 직전에 실행된 upsert의 SQL/파라미터를 캡처해 정합성을 검증한다. */
    private void assertUpsertIsConsistent() {
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SqlParameterSource> paramCaptor = ArgumentCaptor.forClass(SqlParameterSource.class);
        verify(jdbcTemplate).update(sqlCaptor.capture(), paramCaptor.capture());

        String sql = sqlCaptor.getValue();
        Set<String> boundParams = Set.of(paramCaptor.getValue().getParameterNames());

        // 1) SQL의 모든 :플레이스홀더가 실제 바인딩된 파라미터에 존재해야 한다.
        Set<String> placeholders = new LinkedHashSet<>();
        Matcher matcher = PLACEHOLDER.matcher(sql);
        while (matcher.find()) {
            placeholders.add(matcher.group(1));
        }
        assertThat(placeholders).isNotEmpty();
        assertThat(boundParams)
                .as("바인딩되지 않은 플레이스홀더가 없어야 한다")
                .containsAll(placeholders);

        // 2) 충돌 키를 제외한 모든 INSERT 컬럼이 SET 절(col = EXCLUDED.col)에 존재해야 한다.
        List<String> insertColumns = parseColumns(INSERT_COLUMNS, sql);
        Set<String> conflictColumns = Set.copyOf(parseColumns(CONFLICT_COLUMNS, sql));
        String setClause = sql.substring(sql.indexOf("DO UPDATE SET"));
        assertThat(insertColumns).isNotEmpty();
        for (String column : insertColumns) {
            if (conflictColumns.contains(column)) {
                continue;
            }
            assertThat(setClause)
                    .as("INSERT 컬럼 '%s'가 SET 절에 누락되었다", column)
                    .contains(column + " = EXCLUDED." + column);
        }
    }

    private static List<String> parseColumns(Pattern pattern, String sql) {
        Matcher matcher = pattern.matcher(sql);
        if (!matcher.find()) {
            return List.of();
        }
        return List.of(matcher.group(1).split("\\s*,\\s*"));
    }
}
