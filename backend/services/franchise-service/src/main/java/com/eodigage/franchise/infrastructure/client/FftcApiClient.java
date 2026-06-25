package com.eodigage.franchise.infrastructure.client;

import java.net.URI;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.eodigage.franchise.core.common.exception.FranchiseIngestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * 공정거래위원회 가맹사업 OpenAPI(getBrandFntnStats / getBrandFrcsStats) 호출 클라이언트.
 *
 * <p>serviceKey는 공공데이터포털 인코딩 키를 그대로 사용하므로 쿼리스트링을 직접 구성하고
 * {@link URI#create(String)}로 추가 인코딩 없이 전달한다(이중 인코딩 방지).
 */
@Component
@Slf4j
public class FftcApiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public FftcApiClient(ObjectMapper objectMapper) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    public FftcPage fetchPage(
            String baseUrl,
            String serviceKey,
            int pageNo,
            int numOfRows,
            String resultType,
            int year
    ) {
        URI uri = URI.create(baseUrl
                + "?serviceKey=" + serviceKey
                + "&pageNo=" + pageNo
                + "&numOfRows=" + numOfRows
                + "&resultType=" + resultType
                + "&yr=" + year);

        String body;
        try {
            body = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);
        } catch (RuntimeException exception) {
            throw new FranchiseIngestException(
                    "공공데이터 API 호출에 실패했습니다. url=" + baseUrl + ", pageNo=" + pageNo,
                    exception
            );
        }

        return parsePage(body);
    }

    /**
     * 응답 본문(JSON)을 한 페이지로 파싱한다. {@code items.item}이 객체 하나여도 배열로 정규화한다.
     * JSON이 아니면(키 오류 등으로 XML 에러가 오면) 적재 예외로 변환한다.
     */
    FftcPage parsePage(String body) {
        if (body == null || body.isBlank()) {
            throw new FranchiseIngestException("공공데이터 API 응답이 비어 있습니다.");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new FranchiseIngestException(
                    "공공데이터 API 응답을 JSON으로 파싱할 수 없습니다. body=" + snippet(body),
                    exception
            );
        }

        String resultCode = text(root, "resultCode");
        String resultMessage = text(root, "resultMsg");

        // 실제 응답은 items가 직접 배열이다. (문서상 items.item 구조도 호환 처리)
        List<Map<String, String>> items = new ArrayList<>();
        JsonNode itemsNode = root.path("items");
        JsonNode item = itemsNode.isArray() ? itemsNode : itemsNode.path("item");
        if (item.isArray()) {
            item.forEach(node -> items.add(toRow(node)));
        } else if (item.isObject()) {
            items.add(toRow(item));
        }

        return new FftcPage(
                resultCode,
                resultMessage,
                intValue(root, "totalCount"),
                intValue(root, "numOfRows"),
                intValue(root, "pageNo"),
                items
        );
    }

    private Map<String, String> toRow(JsonNode node) {
        Map<String, String> row = new LinkedHashMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            JsonNode value = field.getValue();
            row.put(field.getKey(), value.isNull() ? null : value.asText());
        }
        return row;
    }

    private String text(JsonNode root, String field) {
        JsonNode node = root.path(field);
        return node.isMissingNode() || node.isNull() ? null : node.asText();
    }

    private int intValue(JsonNode root, String field) {
        JsonNode node = root.path(field);
        if (node.isMissingNode() || node.isNull()) {
            return 0;
        }
        if (node.isNumber()) {
            return node.asInt();
        }
        String text = node.asText().trim().replace(",", "");
        if (text.isEmpty()) {
            return 0;
        }
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private String snippet(String body) {
        String normalized = body.strip();
        int limit = 300;
        if (normalized.length() <= limit) {
            return normalized;
        }
        return normalized.substring(0, limit) + "...";
    }
}
