package com.eodigage.franchise.infrastructure.client;

import java.util.List;
import java.util.Map;

/**
 * 공정거래위원회 OpenAPI 한 페이지 응답.
 * {@code items.item}을 행 단위 {@code Map<원천필드명, 값>}으로 평탄화한다.
 */
public record FftcPage(
        String resultCode,
        String resultMessage,
        int totalCount,
        int numOfRows,
        int pageNo,
        List<Map<String, String>> items
) {
}
