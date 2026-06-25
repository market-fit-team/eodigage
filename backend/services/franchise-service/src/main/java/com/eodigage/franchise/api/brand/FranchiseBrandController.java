package com.eodigage.franchise.api.brand;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eodigage.franchise.application.brand.FranchiseBrandQueryService;
import com.eodigage.franchise.application.brand.dto.FranchiseBrandPageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

/**
 * 프랜차이즈 브랜드별 창업예상비용/추정매출 API.
 *
 * <p>업종(industryCode)은 상권분석 업종코드(svc_induty_cd) 기준으로 필터한다.
 */
@RestController
@RequestMapping("/api/v1/franchises")
@Tag(name = "franchise")
@RequiredArgsConstructor
public class FranchiseBrandController {

    private final FranchiseBrandQueryService franchiseBrandQueryService;

    @GetMapping
    @Operation(
            operationId = "getFranchiseBrands",
            summary = "프랜차이즈 브랜드별 창업예상비용/추정매출 목록"
    )
    public FranchiseBrandPageResponse getBrands(
            @Parameter(description = "상권분석 업종코드(svc_induty_cd) 필터")
            @RequestParam(required = false) String industryCode,
            @Parameter(description = "브랜드명 부분일치 필터")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "페이지(0부터)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기(최대 100)")
            @RequestParam(defaultValue = "20") int size
    ) {
        return franchiseBrandQueryService.getBrands(industryCode, keyword, page, size);
    }
}
