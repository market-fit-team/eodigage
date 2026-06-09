package com.example.server.api.post.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CreatePostRequest {

    @Size(max = 500)
    private String content;

    private List<Long> mediaAttachmentIds;

    public List<Long> safeMediaAttachmentIds() {
        return mediaAttachmentIds == null ? List.of() : mediaAttachmentIds;
    }
}
