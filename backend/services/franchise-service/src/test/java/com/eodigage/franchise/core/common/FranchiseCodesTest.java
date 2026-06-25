package com.eodigage.franchise.core.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FranchiseCodesTest {

    @Test
    void 같은_법인_브랜드는_항상_같은_브랜드코드를_만든다() {
        String first = FranchiseCodes.brandCode("㈜하울코퍼레이션", "眞은이국밥");
        String second = FranchiseCodes.brandCode(" ㈜하울코퍼레이션 ", " 眞은이국밥 ");

        assertThat(first).isEqualTo(second).startsWith("FB");
        assertThat(first.length()).isLessThanOrEqualTo(120);
    }

    @Test
    void 다른_브랜드는_다른_코드를_만든다() {
        assertThat(FranchiseCodes.brandCode("A", "치킨집"))
                .isNotEqualTo(FranchiseCodes.brandCode("A", "국밥집"));
    }
}
