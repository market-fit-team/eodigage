package com.eodigage.franchise.application.ingest;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.eodigage.franchise.application.ingest.FranchiseIngestProperties.Endpoint;
import com.eodigage.franchise.core.common.FranchiseCodes;
import com.eodigage.franchise.core.common.exception.FranchiseIngestException;
import com.eodigage.franchise.infrastructure.client.FftcApiClient;
import com.eodigage.franchise.infrastructure.client.FftcPage;
import com.eodigage.franchise.infrastructure.persistence.ingest.FranchiseIngestJdbcRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공정거래위원회 가맹사업 공개 API(창업비용 / 가맹점 매출통계)를 페이지 단위로 모두 조회해
 * franchise DB에 적재한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FranchiseIngestService {

    private final FftcApiClient fftcApiClient;
    private final FranchiseIngestJdbcRepository repository;
    private final FranchiseIngestProperties properties;

    public FranchiseIngestResult ingestAll() {
        long startupCostRows = ingestStartupCosts();
        long salesStatsRows = ingestSalesStats();
        return new FranchiseIngestResult(startupCostRows, salesStatsRows);
    }

    public long ingestStartupCosts() {
        Endpoint endpoint = properties.getApi().getStartupCost();
        Long sourceId = repository.upsertDataSource(
                "api:fftc-brand-fntn-stats",
                "예상 창업비용",
                endpoint.getUrl(),
                "getBrandFntnStats"
        );
        return ingestDataset(endpoint, sourceId, "예상 창업비용",
                (item, brandId, batchId) ->
                        repository.upsertStartupCost(brandId, sourceId, batchId,
                                properties.getIngest().getBaseYear(), item));
    }

    public long ingestSalesStats() {
        Endpoint endpoint = properties.getApi().getSalesStats();
        Long sourceId = repository.upsertDataSource(
                "api:fftc-brand-frcs-stats",
                "평균 월매출(가맹점 통계)",
                endpoint.getUrl(),
                "getBrandFrcsStats"
        );
        return ingestDataset(endpoint, sourceId, "평균 월매출",
                (item, brandId, batchId) ->
                        repository.upsertSalesStats(brandId, sourceId, batchId,
                                properties.getIngest().getBaseYear(), item));
    }

    private long ingestDataset(Endpoint endpoint, Long sourceId, String label, RowUpserter upserter) {
        requireServiceKey(endpoint, label);

        int numOfRows = properties.getIngest().getNumOfRows();
        Long batchId = repository.createIngestBatch(sourceId, endpoint.getUrl(), requestParamsJson(numOfRows));
        IngestContext context = new IngestContext(batchId);

        try {
            FftcPage firstPage = fetchWithRetry(endpoint, 1, numOfRows);
            int totalCount = firstPage.totalCount();
            int totalPages = totalCount <= 0 ? 1 : (int) Math.ceil((double) totalCount / numOfRows);

            long fetched = upsertPage(firstPage, context, upserter);
            for (int pageNo = 2; pageNo <= totalPages; pageNo++) {
                FftcPage page = fetchWithRetry(endpoint, pageNo, numOfRows);
                fetched += upsertPage(page, context, upserter);
                log.info("[{}] page {}/{} 적재 누적 {}건", label, pageNo, totalPages, fetched);
            }

            repository.finishIngestBatch(batchId, "SUCCESS", "적재 완료", totalCount, (int) fetched);
            log.info("[{}] 적재 완료. totalCount={}, fetched={}", label, totalCount, fetched);
            return fetched;
        } catch (RuntimeException exception) {
            repository.failIngestBatch(batchId, "FAILED", exception.getMessage());
            log.error("[{}] 적재 실패", label, exception);
            throw exception;
        }
    }

    private long upsertPage(FftcPage page, IngestContext context, RowUpserter upserter) {
        long count = 0;
        for (Map<String, String> item : page.items()) {
            String companyName = trimToNull(item.get("corpNm"));
            String brandName = trimToNull(item.get("brandNm"));
            if (companyName == null || brandName == null) {
                log.warn("브랜드 식별 정보가 없어 건너뜁니다. item={}", item);
                continue;
            }

            Long industryId = resolveIndustry(item, context);
            Long brandId = resolveBrand(companyName, brandName, industryId,
                    trimToNull(item.get("indutyMlsfcNm")), context);
            upserter.upsert(item, brandId, context.batchId());
            count++;
        }
        return count;
    }

    private Long resolveIndustry(Map<String, String> item, IngestContext context) {
        String lclas = trimToNull(item.get("indutyLclasNm"));
        String mlsfc = trimToNull(item.get("indutyMlsfcNm"));
        if (lclas == null || mlsfc == null) {
            return null;
        }
        String cacheKey = lclas + "::" + mlsfc;
        return context.industryIds().computeIfAbsent(
                cacheKey,
                key -> repository.upsertIndustry(lclas, mlsfc)
        );
    }

    private Long resolveBrand(
            String companyName,
            String brandName,
            Long industryId,
            String indutyMlsfcNm,
            IngestContext context
    ) {
        String brandCode = FranchiseCodes.brandCode(companyName, brandName);
        String cacheKey = brandCode + "::" + (indutyMlsfcNm == null ? "" : indutyMlsfcNm);
        return context.brandIds().computeIfAbsent(
                cacheKey,
                key -> repository.upsertBrand(brandCode, brandName, companyName, industryId, indutyMlsfcNm)
        );
    }

    private FftcPage fetchWithRetry(Endpoint endpoint, int pageNo, int numOfRows) {
        int maxRetries = Math.max(1, properties.getIngest().getMaxRetries());
        RuntimeException lastFailure = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return fftcApiClient.fetchPage(
                        endpoint.getUrl(),
                        endpoint.getServiceKey(),
                        pageNo,
                        numOfRows,
                        properties.getIngest().getResultType(),
                        properties.getIngest().getBaseYear()
                );
            } catch (RuntimeException exception) {
                lastFailure = exception;
                log.warn("page {} 조회 실패 ({}/{}). {}", pageNo, attempt, maxRetries, exception.getMessage());
                sleepBeforeRetry(attempt);
            }
        }
        throw new FranchiseIngestException("page " + pageNo + " 조회를 " + maxRetries + "회 재시도했으나 실패했습니다.",
                lastFailure);
    }

    private void sleepBeforeRetry(int attempt) {
        try {
            Thread.sleep(Math.min(2000L, 300L * attempt));
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new FranchiseIngestException("적재 재시도 대기 중 인터럽트되었습니다.", interrupted);
        }
    }

    private void requireServiceKey(Endpoint endpoint, String label) {
        if (endpoint.getServiceKey() == null || endpoint.getServiceKey().isBlank()) {
            throw new FranchiseIngestException("[" + label + "] 공공데이터 serviceKey가 설정되지 않았습니다.");
        }
    }

    private String requestParamsJson(int numOfRows) {
        return "{\"numOfRows\":" + numOfRows
                + ",\"resultType\":\"" + properties.getIngest().getResultType() + "\""
                + ",\"yr\":" + properties.getIngest().getBaseYear() + "}";
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @FunctionalInterface
    private interface RowUpserter {
        void upsert(Map<String, String> item, Long brandId, Long batchId);
    }

    private record IngestContext(
            Long batchId,
            Map<String, Long> industryIds,
            Map<String, Long> brandIds
    ) {
        IngestContext(Long batchId) {
            this(batchId, new HashMap<>(), new HashMap<>());
        }
    }
}
