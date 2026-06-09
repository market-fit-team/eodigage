package com.example.server.api.scheduledpost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record UpdateScheduledPostRequest(
        @NotBlank
        @Size(max = 500)
        String content,

        @NotNull
        Instant scheduledAt
) {
}
