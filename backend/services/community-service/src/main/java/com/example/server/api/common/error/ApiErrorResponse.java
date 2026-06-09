package com.example.server.api.common.error;

import java.time.Instant;

import jakarta.servlet.http.HttpServletRequest;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
    public static ApiErrorResponse of(
            int status,
            String error,
            String message,
            HttpServletRequest request
    ) {
        return new ApiErrorResponse(
                Instant.now(),
                status,
                error,
                message,
                request.getRequestURI()
        );
    }
}
