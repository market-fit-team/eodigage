package com.eodigage.franchise.infrastructure.persistence.ingest;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FranchiseIndustryMappingTest {

    @Test
    void marketIndustryMapping은_공정위_중분류를_상권분석_업종으로_매핑한다() {
        FranchiseIngestJdbcRepository.MarketIndustryMapping coffee =
                FranchiseIngestJdbcRepository.marketIndustryMapping("커피");
        FranchiseIngestJdbcRepository.MarketIndustryMapping grocery =
                FranchiseIngestJdbcRepository.marketIndustryMapping("종합소매점");

        assertThat(coffee.code()).isEqualTo("CS100010");
        assertThat(coffee.name()).isEqualTo("커피-음료");
        assertThat(grocery.code()).isEqualTo("CS300001");
        assertThat(grocery.name()).isEqualTo("슈퍼마켓");
    }

    @Test
    void marketIndustryMapping은_상권분석에_대응되지_않는_중분류를_null로_둔다() {
        assertThat(FranchiseIngestJdbcRepository.marketIndustryMapping("기타 소매")).isNull();
        assertThat(FranchiseIngestJdbcRepository.marketIndustryMapping("배달")).isNull();
    }

    @Test
    void brandIndustryMapping은_brandCode_직접_보정을_우선_적용한다() {
        FranchiseIngestJdbcRepository.MarketIndustryMapping mapping =
                FranchiseIngestJdbcRepository.brandIndustryMapping(
                        "FB04aef03146f7651432c62fcf8640ee",
                        "기타 외식",
                        "원본명",
                        "회사명"
                );

        assertThat(mapping.code()).isEqualTo("CS100008");
        assertThat(mapping.name()).isEqualTo("분식전문점");
    }

    @Test
    void brandIndustryMapping은_중분류와_브랜드명으로_기타_버킷을_보정한다() {
        FranchiseIngestJdbcRepository.MarketIndustryMapping burger =
                FranchiseIngestJdbcRepository.brandIndustryMapping(
                        "random-brand-code",
                        "기타 외식",
                        "맛있는 버거",
                        "회사명"
                );
        FranchiseIngestJdbcRepository.MarketIndustryMapping coffee =
                FranchiseIngestJdbcRepository.brandIndustryMapping(
                        "random-brand-code",
                        "기타 외식",
                        "라떼 연구소",
                        "회사명"
                );

        assertThat(burger.code()).isEqualTo("CS100006");
        assertThat(burger.name()).isEqualTo("패스트푸드점");
        assertThat(coffee.code()).isEqualTo("CS100010");
        assertThat(coffee.name()).isEqualTo("커피-음료");
    }

    @Test
    void brandIndustryMapping은_규칙_대상_중분류가_아니면_null로_둔다() {
        assertThat(FranchiseIngestJdbcRepository.brandIndustryMapping(
                "random-brand-code",
                "한식",
                "커피 한식당",
                "회사명"
        )).isNull();
    }
}
