package com.eodigage.franchise.core.common.exception;

/**
 * 공공데이터 적재 중 발생하는 오류(HTTP 실패, 응답 파싱 실패, 서비스키 누락 등).
 */
public class FranchiseIngestException extends RuntimeException {

    public FranchiseIngestException(String message) {
        super(message);
    }

    public FranchiseIngestException(String message, Throwable cause) {
        super(message, cause);
    }
}
