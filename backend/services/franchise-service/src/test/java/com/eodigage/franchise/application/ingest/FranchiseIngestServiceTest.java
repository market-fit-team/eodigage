package com.eodigage.franchise.application.ingest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.eodigage.franchise.core.common.exception.FranchiseIngestException;
import com.eodigage.franchise.infrastructure.client.FftcApiClient;
import com.eodigage.franchise.infrastructure.client.FftcPage;
import com.eodigage.franchise.infrastructure.persistence.ingest.FranchiseIngestJdbcRepository;

@ExtendWith(MockitoExtension.class)
class FranchiseIngestServiceTest {

    @Mock
    private FftcApiClient client;

    @Mock
    private FranchiseIngestJdbcRepository repository;

    private FranchiseIngestProperties properties;
    private FranchiseIngestService service;

    @BeforeEach
    void setUp() {
        properties = new FranchiseIngestProperties();
        properties.getIngest().setBaseYear(2025);
        properties.getIngest().setNumOfRows(2);
        properties.getIngest().setResultType("json");
        properties.getIngest().setMaxRetries(1);
        properties.getApi().getStartupCost().setUrl("https://startup");
        properties.getApi().getStartupCost().setServiceKey("startup-key");
        properties.getApi().getSalesStats().setUrl("https://sales");
        properties.getApi().getSalesStats().setServiceKey("sales-key");

        service = new FranchiseIngestService(client, repository, properties);
    }

    @Test
    void 모든_페이지를_조회해_창업비용을_적재한다() {
        given(repository.upsertDataSource(any(), any(), any(), any())).willReturn(1L);
        given(repository.createIngestBatch(eq(1L), any(), any())).willReturn(10L);
        given(repository.upsertIndustry(any(), any())).willReturn(100L);
        given(repository.upsertBrand(any(), any(), any(), any(), any())).willReturn(200L);
        // totalCount=3, numOfRows=2 -> 2 페이지
        given(client.fetchPage("https://startup", "startup-key", 1, 2, "json", 2025))
                .willReturn(new FftcPage("00", "ok", 3, 2, 1, List.of(
                        item("㈜A", "브랜드1", "외식", "한식"),
                        item("㈜B", "브랜드2", "외식", "한식")
                )));
        given(client.fetchPage("https://startup", "startup-key", 2, 2, "json", 2025))
                .willReturn(new FftcPage("00", "ok", 3, 2, 2, List.of(
                        item("㈜C", "브랜드3", "외식", "한식")
                )));

        long rows = service.ingestStartupCosts();

        assertThat(rows).isEqualTo(3);
        verify(repository, times(3)).upsertStartupCost(eq(200L), eq(1L), eq(10L), eq(2025), any());
        verify(repository, times(3)).upsertBrand(any(), any(), any(), any(), any());
        verify(repository, times(1)).upsertIndustry(any(), any()); // 동일 업종은 캐시
        verify(repository).finishIngestBatch(10L, "SUCCESS", "적재 완료", 3, 3);
    }

    @Test
    void 브랜드_식별정보가_없는_행은_건너뛴다() {
        given(repository.upsertDataSource(any(), any(), any(), any())).willReturn(1L);
        given(repository.createIngestBatch(anyLong(), any(), any())).willReturn(10L);
        given(repository.upsertIndustry(any(), any())).willReturn(100L);
        given(repository.upsertBrand(any(), any(), any(), any(), any())).willReturn(200L);
        given(client.fetchPage(any(), any(), anyInt(), anyInt(), any(), anyInt()))
                .willReturn(new FftcPage("00", "ok", 2, 2, 1, List.of(
                        item("㈜A", "브랜드1", "외식", "한식"),
                        item(null, "브랜드X", "외식", "한식") // corpNm 없음 -> skip
                )));

        long rows = service.ingestStartupCosts();

        assertThat(rows).isEqualTo(1);
        verify(repository, times(1)).upsertStartupCost(anyLong(), anyLong(), anyLong(), anyInt(), any());
    }

    @Test
    void serviceKey가_없으면_적재예외를_던지고_배치를_만들지_않는다() {
        properties.getApi().getStartupCost().setServiceKey("");
        given(repository.upsertDataSource(any(), any(), any(), any())).willReturn(1L);

        assertThatThrownBy(() -> service.ingestStartupCosts())
                .isInstanceOf(FranchiseIngestException.class);
        verify(repository, never()).createIngestBatch(anyLong(), any(), any());
    }

    @Test
    void 페이지_조회가_실패하면_배치를_실패처리하고_예외를_전파한다() {
        given(repository.upsertDataSource(any(), any(), any(), any())).willReturn(1L);
        given(repository.createIngestBatch(anyLong(), any(), any())).willReturn(10L);
        given(client.fetchPage(any(), any(), anyInt(), anyInt(), any(), anyInt()))
                .willThrow(new FranchiseIngestException("API 호출 실패"));

        assertThatThrownBy(() -> service.ingestStartupCosts())
                .isInstanceOf(FranchiseIngestException.class);
        verify(repository).failIngestBatch(eq(10L), eq("FAILED"), any());
    }

    private Map<String, String> item(String corpNm, String brandNm, String lclas, String mlsfc) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("corpNm", corpNm);
        row.put("brandNm", brandNm);
        row.put("indutyLclasNm", lclas);
        row.put("indutyMlsfcNm", mlsfc);
        row.put("jngBzmnJngAmt", "3300");
        row.put("smtnAmt", "5500");
        return row;
    }
}
