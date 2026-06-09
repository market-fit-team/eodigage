package com.example.server.api.post.dto;

import java.util.List;

public record PostThreadResponse(
        List<PostSummaryResponse> ancestors,
        PostSummaryResponse post,
        CursorPageResponse<PostSummaryResponse> replies
) {
}
