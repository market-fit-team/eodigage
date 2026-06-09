package com.example.server.infrastructure.persistence.post.query;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface PostThreadRepository extends Repository<PostSummaryView, Long> {

    @Query(value = """
            with recursive ancestors as (
                select id, parent_id, depth
                from posts
                where id = :postId
                union all
                select p.id, p.parent_id, p.depth
                from posts p
                join ancestors a on p.id = a.parent_id
            )
            select id
            from ancestors
            where id <> :postId
            order by depth asc, id asc
            """, nativeQuery = true)
    List<Long> findAncestorIds(@Param("postId") Long postId);
}
