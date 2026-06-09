package com.example.server.core.semantic.event;

import com.example.server.core.semantic.PostSemanticSyncType;

public record PostSemanticSyncEvent(
        Long postId,
        PostSemanticSyncType type
) {
}
