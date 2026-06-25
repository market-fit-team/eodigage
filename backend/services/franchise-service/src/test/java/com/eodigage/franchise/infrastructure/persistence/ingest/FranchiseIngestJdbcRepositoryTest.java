package com.eodigage.franchise.infrastructure.persistence.ingest;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

class FranchiseIngestJdbcRepositoryTest {

    @Test
    void longValue는_콤마_공백_하이픈_누락을_null로_정규화한다() {
        Map<String, String> item = new HashMap<>();
        item.put("amt", "1,234,567");
        item.put("blank", "  ");
        item.put("dash", "-");
        item.put("zero", "0");

        assertThat(FranchiseIngestJdbcRepository.longValue(item, "amt")).isEqualTo(1_234_567L);
        assertThat(FranchiseIngestJdbcRepository.longValue(item, "blank")).isNull();
        assertThat(FranchiseIngestJdbcRepository.longValue(item, "dash")).isNull();
        assertThat(FranchiseIngestJdbcRepository.longValue(item, "missing")).isNull();
        assertThat(FranchiseIngestJdbcRepository.longValue(item, "zero")).isEqualTo(0L);
    }

    @Test
    void intValue는_long을_int로_변환한다() {
        Map<String, String> item = new HashMap<>();
        item.put("cnt", "9");

        assertThat(FranchiseIngestJdbcRepository.intValue(item, "cnt")).isEqualTo(9);
        assertThat(FranchiseIngestJdbcRepository.intValue(item, "missing")).isNull();
    }
}
