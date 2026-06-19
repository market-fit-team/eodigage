CREATE TABLE news_post (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    summary TEXT,
    category VARCHAR(255),
    thumbnail_url VARCHAR(255),
    link_url VARCHAR(255)
);