package com.example.server.core.news;

import jakarta.persistence.*;

@Entity
public class NewsPost {

    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String summary;
    private String category;
    private String thumbnailUrl;
    private String linkUrl;

    protected NewsPost() {
    }

    public NewsPost(String title, String summary, String category, String thumbnailUrl, String linkUrl) {
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.thumbnailUrl = thumbnailUrl;
        this.linkUrl = linkUrl;
    }

    public void update(String title, String summary, String category, String thumbnailUrl, String linkUrl) {
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.thumbnailUrl = thumbnailUrl;
        this.linkUrl = linkUrl;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getCategory() { return category; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getLinkUrl() { return linkUrl; }
}