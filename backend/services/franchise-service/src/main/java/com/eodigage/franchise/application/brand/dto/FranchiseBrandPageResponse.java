package com.eodigage.franchise.application.brand.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

/** 프랜차이즈 브랜드 목록 페이지 응답. */
@Schema(description = "프랜차이즈 브랜드 목록(페이지)")
public record FranchiseBrandPageResponse(
        List<FranchiseBrandResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
