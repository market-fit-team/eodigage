package com.eodigage.franchise.application.brand.dto;

import com.eodigage.franchise.infrastructure.persistence.brand.FranchiseBrandJdbcRepository.FranchiseBrandRow;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 프랜차이즈 브랜드별 창업예상비용/추정매출 응답.
 *
 * <p>{@code industryName}은 상권분석 정본 업종명이며, 매핑이 없으면 "기타"로 노출한다.
 * 금액 단위는 공정위 원천 그대로 천원(1,000원) 단위다.
 */
@Schema(description = "프랜차이즈 브랜드별 창업예상비용/추정매출")
public record FranchiseBrandResponse(
        String brandCode,
        String brandName,
        String companyName,
        @Schema(description = "상권분석 정본 업종명(미매핑이면 '기타')") String industryName,
        @Schema(description = "공정위 원본 업종(중분류)") String ftcIndustryName,
        Integer baseYear,
        @Schema(description = "창업예상비용") StartupCost startupCost,
        @Schema(description = "추정매출") Sales sales
) {

    /** 미매핑(기타) 표시값. */
    private static final String ETC_INDUSTRY = "기타";

    public static FranchiseBrandResponse from(FranchiseBrandRow row) {
        return new FranchiseBrandResponse(
                row.brandCode(),
                row.brandName(),
                row.companyName(),
                row.marketIndustryName() != null ? row.marketIndustryName() : ETC_INDUSTRY,
                row.ftcIndustryName(),
                row.baseYear(),
                new StartupCost(
                        row.startupTotalAmount(),
                        row.franchiseFeeAmount(),
                        row.educationFeeAmount(),
                        row.etcAmount(),
                        row.depositAmount()
                ),
                new Sales(
                        row.averageSalesAmount(),
                        row.areaUnitAverageSalesAmount(),
                        row.franchiseCount()
                )
        );
    }

    @Schema(description = "창업예상비용(천원). 항목 합계 = totalAmount")
    public record StartupCost(
            @Schema(description = "합계(천원)") Long totalAmount,
            @Schema(description = "가맹비(천원)") Long franchiseFee,
            @Schema(description = "교육비(천원)") Long educationFee,
            @Schema(description = "기타비용(천원)") Long etcAmount,
            @Schema(description = "보증금(천원)") Long deposit
    ) {
    }

    @Schema(description = "추정매출")
    public record Sales(
            @Schema(description = "가맹점 평균 매출액(천원/년)") Long averageSalesAmount,
            @Schema(description = "면적(3.3㎡)당 평균 매출액(천원/년)") Long areaUnitAverageSalesAmount,
            @Schema(description = "가맹점 수") Integer franchiseCount
    ) {
    }
}
