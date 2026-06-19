package com.example.server.api.news;

import com.example.server.application.news.NewsPostService;
import com.example.server.application.news.NewsPostService.NewsPostRequest;
import com.example.server.core.news.NewsPost;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news-posts")
public class NewsPostController {

    private final NewsPostService service;

    public NewsPostController(NewsPostService service) {
        this.service = service;
    }

    @GetMapping
    public List<NewsPost> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public NewsPost findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public NewsPost create(@RequestBody NewsPostRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public NewsPost update(
            @PathVariable Long id,
            @RequestBody NewsPostRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}