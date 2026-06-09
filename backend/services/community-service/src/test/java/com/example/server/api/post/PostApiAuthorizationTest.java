package com.example.server.api.post;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.example.server.support.IntegrationTestSupport;
import com.example.server.support.TestDataHelper;
import com.example.server.core.user.User;

class PostApiAuthorizationTest extends IntegrationTestSupport {

    @Autowired
    private TestDataHelper testDataHelper;

    @Test
    void 로그인하지_않으면_게시글을_생성할_수_없다() throws Exception {
        mockMvc.perform(post("/api/v1/posts")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"권한 테스트\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void 로그인했지만_csrf가_없으면_게시글을_생성할_수_없다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");

        mockMvc.perform(post("/api/v1/posts")
                        .with(oidcLogin().idToken(token -> token.subject(alice.getProviderSubject())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"CSRF 테스트\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void 로그인하면_게시글을_생성할_수_있다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");

        mockMvc.perform(post("/api/v1/posts")
                        .with(oidcLogin().idToken(token -> token.subject(alice.getProviderSubject())))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"첫 번째 글\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("첫 번째 글"));
    }

    @Test
    void 작성자가_아니면_게시글을_수정할_수_없다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");
        User bob = testDataHelper.createGoogleUser("google-sub-bob", "bob@example.com");
        Long postId = testDataHelper.createPost(alice, "Alice 글");

        mockMvc.perform(put("/api/v1/posts/{id}", postId)
                        .with(oidcLogin().idToken(token -> token.subject(bob.getProviderSubject())))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Bob의 수정 시도\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void 작성자는_본인_게시글을_수정할_수_있다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");
        Long postId = testDataHelper.createPost(alice, "수정 전");

        mockMvc.perform(put("/api/v1/posts/{id}", postId)
                        .with(oidcLogin().idToken(token -> token.subject(alice.getProviderSubject())))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"수정 후\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("수정 후"));
    }

    @Test
    void 삭제된_게시글은_수정할_수_없다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");
        Long postId = testDataHelper.createPost(alice, "삭제될 글");
        testDataHelper.softDeletePost(alice, postId);

        mockMvc.perform(put("/api/v1/posts/{id}", postId)
                        .with(oidcLogin().idToken(token -> token.subject(alice.getProviderSubject())))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"수정 시도\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void 작성자가_아니면_게시글을_삭제할_수_없다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");
        User bob = testDataHelper.createGoogleUser("google-sub-bob", "bob@example.com");
        Long postId = testDataHelper.createPost(alice, "Alice 글");

        mockMvc.perform(delete("/api/v1/posts/{id}", postId)
                        .with(oidcLogin().idToken(token -> token.subject(bob.getProviderSubject())))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void 작성자는_본인_게시글을_삭제할_수_있다() throws Exception {
        User alice = testDataHelper.createGoogleUser("google-sub-alice", "alice@example.com");
        Long postId = testDataHelper.createPost(alice, "삭제할 글");

        mockMvc.perform(delete("/api/v1/posts/{id}", postId)
                        .with(oidcLogin().idToken(token -> token.subject(alice.getProviderSubject())))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
