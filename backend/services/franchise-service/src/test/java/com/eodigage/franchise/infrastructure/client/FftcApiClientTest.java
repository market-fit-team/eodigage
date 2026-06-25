package com.eodigage.franchise.infrastructure.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.eodigage.franchise.core.common.exception.FranchiseIngestException;
import com.fasterxml.jackson.databind.ObjectMapper;

class FftcApiClientTest {

    private final FftcApiClient client = new FftcApiClient(new ObjectMapper());

    @Test
    void items_item이_배열이면_각_행을_맵으로_평탄화한다() {
        String body = """
                {
                  "resultCode": "00", "resultMsg": "NORMAL SERVICE",
                  "numOfRows": "2", "pageNo": "1", "totalCount": "3",
                  "items": { "item": [
                    {"corpNm": "㈜하울코퍼레이션", "brandNm": "眞은이국밥", "jngBzmnJngAmt": "3,300", "yr": "2025"},
                    {"corpNm": "㈜더블와이에프앤비", "brandNm": "미조리해물찜", "avrgSlsAmt": "473825"}
                  ]}
                }
                """;

        FftcPage page = client.parsePage(body);

        assertThat(page.resultCode()).isEqualTo("00");
        assertThat(page.totalCount()).isEqualTo(3);
        assertThat(page.numOfRows()).isEqualTo(2);
        assertThat(page.pageNo()).isEqualTo(1);
        assertThat(page.items()).hasSize(2);
        assertThat(page.items().get(0))
                .containsEntry("corpNm", "㈜하울코퍼레이션")
                .containsEntry("jngBzmnJngAmt", "3,300");
    }

    @Test
    void items가_직접_배열이고_숫자필드여도_파싱한다() {
        // 실제 getBrandFntnStats 응답 형태: items가 곧 배열이고 금액은 JSON 숫자다.
        String body = """
                {
                  "resultCode": "00", "resultMsg": "NORMAL SERVICE",
                  "numOfRows": "2", "pageNo": "1", "totalCount": 11724,
                  "items": [
                    {"yr": "2025", "indutyLclasNm": "외식", "indutyMlsfcNm": "한식",
                     "brandNm": "가담육회", "corpNm": "가담육회", "jngBzmnJngAmt": 3300, "smtnAmt": 45275}
                  ]
                }
                """;

        FftcPage page = client.parsePage(body);

        assertThat(page.totalCount()).isEqualTo(11724);
        assertThat(page.items()).hasSize(1);
        assertThat(page.items().get(0))
                .containsEntry("corpNm", "가담육회")
                .containsEntry("jngBzmnJngAmt", "3300");
    }

    @Test
    void items_item이_객체_하나여도_배열로_정규화한다() {
        String body = """
                {
                  "totalCount": "1",
                  "items": { "item": {"corpNm": "A", "brandNm": "B"} }
                }
                """;

        FftcPage page = client.parsePage(body);

        assertThat(page.totalCount()).isEqualTo(1);
        assertThat(page.items()).hasSize(1);
        assertThat(page.items().get(0)).containsEntry("brandNm", "B");
    }

    @Test
    void 빈_응답은_적재예외로_변환한다() {
        assertThatThrownBy(() -> client.parsePage("   "))
                .isInstanceOf(FranchiseIngestException.class);
    }

    @Test
    void JSON이_아니면_적재예외로_변환한다() {
        String xmlError = "<OpenAPI_ServiceResponse><cmmMsgHeader>"
                + "<returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>";

        assertThatThrownBy(() -> client.parsePage(xmlError))
                .isInstanceOf(FranchiseIngestException.class);
    }
}
