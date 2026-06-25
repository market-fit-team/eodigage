package com.eodigage.franchise.application.brand;

import java.util.List;

import org.springframework.stereotype.Service;

import com.eodigage.franchise.application.brand.dto.FranchiseBrandPageResponse;
import com.eodigage.franchise.application.brand.dto.FranchiseBrandResponse;
import com.eodigage.franchise.infrastructure.persistence.brand.FranchiseBrandJdbcRepository;

import lombok.RequiredArgsConstructor;

/** 프랜차이즈 브랜드별 창업예상비용/추정매출 조회 서비스. */
@Service
@RequiredArgsConstructor
public class FranchiseBrandQueryService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final FranchiseBrandJdbcRepository repository;

    public FranchiseBrandPageResponse getBrands(String industryCode, String keyword, int page, int size) {
        int safeSize = clamp(size <= 0 ? DEFAULT_SIZE : size, 1, MAX_SIZE);
        int safePage = Math.max(page, 0);
        String filterIndustryCode = blankToNull(industryCode);
        String filterKeyword = blankToNull(keyword);

        long totalElements = repository.countBrands(filterIndustryCode, filterKeyword);
        long offset = (long) safePage * safeSize;

        List<FranchiseBrandResponse> items = repository
                .findBrands(filterIndustryCode, filterKeyword, safeSize, offset)
                .stream()
                .map(FranchiseBrandResponse::from)
                .toList();

        int totalPages = (int) Math.ceil((double) totalElements / safeSize);
        return new FranchiseBrandPageResponse(items, safePage, safeSize, totalElements, totalPages);
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(value, max));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
