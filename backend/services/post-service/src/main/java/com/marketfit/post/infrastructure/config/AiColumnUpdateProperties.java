package com.marketfit.post.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.post.ai-column-update")
public record AiColumnUpdateProperties(
        boolean enabled,
        String actorId,
        String keyword
) {
    public AiColumnUpdateProperties {
        actorId = actorId == null || actorId.isBlank()
                ? "system-ai-column-scheduler"
                : actorId.trim();
        keyword = keyword == null || keyword.isBlank()
                ? "창업 프랜차이즈 상권 트렌드"
                : keyword.trim();
    }
}
