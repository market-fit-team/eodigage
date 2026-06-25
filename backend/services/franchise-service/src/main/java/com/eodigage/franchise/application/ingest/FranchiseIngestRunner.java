package com.eodigage.franchise.application.ingest;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 부팅 시 {@code franchise.ingest.enabled=true}일 때만 공공데이터 적재를 실행한다.
 * market-service의 임포트 러너와 동일하게 1회성 적재 후 플래그를 내리는 방식이다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(100)
public class FranchiseIngestRunner implements ApplicationRunner {

    private final FranchiseIngestService franchiseIngestService;
    private final FranchiseIngestProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.getIngest().isEnabled()) {
            return;
        }

        log.info("Starting franchise public-data ingestion. baseYear={}, numOfRows={}",
                properties.getIngest().getBaseYear(), properties.getIngest().getNumOfRows());
        FranchiseIngestResult result = franchiseIngestService.ingestAll();
        log.info("Finished franchise public-data ingestion. startupCostRows={}, salesStatsRows={}",
                result.startupCostRows(), result.salesStatsRows());
    }
}
