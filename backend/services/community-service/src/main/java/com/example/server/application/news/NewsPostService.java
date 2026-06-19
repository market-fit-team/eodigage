package com.example.server.application.news;

import com.example.server.core.news.NewsPost;
import com.example.server.infrastructure.news.NewsPostRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NewsPostService {

    private final NewsPostRepository repository;

    public NewsPostService(NewsPostRepository repository) {
        this.repository = repository;
    }

    public List<NewsPost> findAll() {
        List<NewsPost> result = new ArrayList<>();
        repository.findAll().forEach(result::add);
        return result;
    }

    public NewsPost findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("NewsPost not found: " + id));
    }

    public NewsPost create(NewsPostRequest request) {
        NewsPost post = new NewsPost(
                request.title(),
                request.summary(),
                request.category(),
                request.thumbnailUrl(),
                request.linkUrl()
        );

        return repository.save(post);
    }

    public NewsPost update(Long id, NewsPostRequest request) {
        NewsPost post = findById(id);

        post.update(
                request.title(),
                request.summary(),
                request.category(),
                request.thumbnailUrl(),
                request.linkUrl()
        );

        return repository.save(post);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public record NewsPostRequest(
            String title,
            String summary,
            String category,
            String thumbnailUrl,
            String linkUrl
    ) {
    }
}