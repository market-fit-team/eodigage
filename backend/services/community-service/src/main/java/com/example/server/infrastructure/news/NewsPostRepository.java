package com.example.server.infrastructure.news;

import com.example.server.core.news.NewsPost;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsPostRepository
        extends JpaRepository<NewsPost, Long> {
}