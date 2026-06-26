package com.marketfit.post.api.comment;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.marketfit.post.api.comment.dto.CommentRequest;
import com.marketfit.post.api.comment.dto.CommentResponse;
import com.marketfit.post.application.comment.PostCommentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
@Tag(name = "post-comments")
public class PostCommentController {

    private final PostCommentService commentService;

    @GetMapping
    @Operation(operationId = "getPostComments", summary = "AI 칼럼 댓글 목록 조회")
    public List<CommentResponse> findByPostId(
            @PathVariable UUID postId,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        return commentService.findByPostId(postId, jwt == null ? null : jwt.getSubject());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(operationId = "createPostComment", summary = "AI 칼럼 댓글 작성")
    public CommentResponse create(
            @PathVariable UUID postId,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.create(postId, jwt.getSubject(), authorName(jwt), request.content());
    }

    @PutMapping("/{commentId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(operationId = "updatePostComment", summary = "AI 칼럼 댓글 수정")
    public CommentResponse update(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.update(postId, commentId, jwt.getSubject(), request.content());
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(operationId = "deletePostComment", summary = "AI 칼럼 댓글 삭제")
    public void delete(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        commentService.delete(postId, commentId, jwt.getSubject());
    }

    private String authorName(Jwt jwt) {
        String name = jwt.getClaimAsString("name");
        return name == null || name.isBlank() ? jwt.getSubject() : name;
    }
}
