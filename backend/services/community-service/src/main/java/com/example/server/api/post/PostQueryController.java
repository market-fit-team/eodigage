package com.example.server.api.post;

import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.api.post.dto.CursorPageResponse;
import com.example.server.api.post.dto.PostResponse;
import com.example.server.api.post.dto.PostSummaryResponse;
import com.example.server.api.post.dto.PostThreadResponse;
import com.example.server.application.auth.CurrentUserService;
import com.example.server.application.post.query.PostQueryService;
import com.example.server.core.user.User;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "posts")
public class PostQueryController {

    private final PostQueryService postQueryService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(operationId = "getPosts", summary = "게시글 페이지 조회")
    public Page<PostSummaryResponse> findOffsetPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        User currentUser = currentUserService.getRequiredUser(jwt);
        return postQueryService.findOffsetPage(page, size, currentUser);
    }

    @GetMapping("/cursor")
    @Operation(operationId = "getPostsByCursor", summary = "게시글 커서 페이지 조회")
    public CursorPageResponse<PostSummaryResponse> findCursorPage(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        User currentUser = currentUserService.getRequiredUser(jwt);
        return postQueryService.findCursorPage(cursor, size, currentUser);
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getPost", summary = "게시글 단건 조회")
    public PostResponse findById(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        User currentUser = currentUserService.getRequiredUser(jwt);
        return postQueryService.findById(id, currentUser);
    }

    @GetMapping("/{postId}/replies")
    @Operation(operationId = "getPostReplies", summary = "게시글 답글 목록 조회")
    public CursorPageResponse<PostSummaryResponse> findReplies(
            @PathVariable Long postId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        User currentUser = currentUserService.getRequiredUser(jwt);
        return postQueryService.findRepliesCursorPage(postId, cursor, size, currentUser);
    }

    @GetMapping("/{postId}/thread")
    @Operation(operationId = "getPostThread", summary = "게시글 스레드 조회")
    public PostThreadResponse findThread(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt
    ) {
        User currentUser = currentUserService.getRequiredUser(jwt);
        return postQueryService.findThread(postId, size, currentUser);
    }
}
