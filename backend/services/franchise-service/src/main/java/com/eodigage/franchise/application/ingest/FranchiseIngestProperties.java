package com.eodigage.franchise.application.ingest;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * franchise 공공데이터 적재 설정. {@code application.yaml}의 {@code franchise.*}에 바인딩된다.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "franchise")
public class FranchiseIngestProperties {

    private Ingest ingest = new Ingest();
    private Api api = new Api();

    @Getter
    @Setter
    public static class Ingest {
        /** 적재 러너 활성화 여부. 기본 false(부팅 시 자동 적재하지 않음). */
        private boolean enabled = false;
        /** 조회 기준 연도(yr 파라미터). */
        private int baseYear = 2025;
        /** 페이지당 행 수(numOfRows). 한 번에 많이 가져와 페이지 수를 줄인다. */
        private int numOfRows = 1000;
        /** 응답 형식(resultType). */
        private String resultType = "json";
        /** 페이지 조회 실패 시 재시도 횟수. */
        private int maxRetries = 3;
    }

    @Getter
    @Setter
    public static class Api {
        private Endpoint startupCost = new Endpoint();
        private Endpoint salesStats = new Endpoint();
    }

    @Getter
    @Setter
    public static class Endpoint {
        private String url;
        private String serviceKey;
    }
}
