package com.example.server.infrastructure.persistence.post;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.core.post.Post;

public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"user", "parent", "root"})
    Optional<Post> findWithUserById(Long id);
}
