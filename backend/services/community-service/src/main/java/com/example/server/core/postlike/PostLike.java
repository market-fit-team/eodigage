package com.example.server.core.postlike;

import java.time.Instant;

import com.example.server.core.post.Post;
import com.example.server.core.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity // NOTE: [JPA] 데이터베이스 테이블과 직접 매핑되는 객체
@Table(
        name = "post_likes", // NOTE: [JPA] 실제 매핑될 DB의 좋아요 테이블명
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_post_likes_post_user", // NOTE: [JPA] 동일 게시글에 대한 동일 사용자의 중복 좋아요 방지 유니크 제약
                        columnNames = {"post_id", "user_id"}
                )
        }
)
@Getter // NOTE: [Lombok] 필드들의 Getter 메서드 자동 생성
@NoArgsConstructor(access = AccessLevel.PROTECTED) // NOTE: [Lombok] 프록시 조회를 위한 기본 생성자를 PROTECTED 권한으로 자동 생성
public class PostLike {

    @Id // NOTE: [JPA] Primary Key로 매핑할 필드 지정
    @GeneratedValue(strategy = GenerationType.IDENTITY) // NOTE: [JPA] 기본키 생성을 데이터베이스 Auto Increment에 위임
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // NOTE: [JPA] 성능 최적화를 위한 지연 로딩 및 필수 외래 키 설정
    @JoinColumn(name = "post_id", nullable = false) // NOTE: [JPA] 외래 키(post_id) 매핑
    private Post post; // NOTE: [JPA] 좋아요 대상 게시글 정보

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // NOTE: [JPA] 성능 최적화를 위한 지연 로딩 및 필수 외래 키 설정
    @JoinColumn(name = "user_id", nullable = false) // NOTE: [JPA] 외래 키(user_id) 매핑
    private User user; // NOTE: [JPA] 좋아요를 누른 로컬 회원 정보

    @Column(name = "created_at", nullable = false, updatable = false) // NOTE: [JPA] 좋아요 등록 시각 (수정 불가능하도록 설정)
    private Instant createdAt;

    public PostLike(Post post, User user) { // NOTE: [Java] 필수 게시글 정보와 회원을 주입받는 생성자
        this.post = post;
        this.user = user;
    }

    @PrePersist
    void prePersist() { // NOTE: [JPA] 엔티티가 최초로 DB에 영속화(INSERT)되기 전에 실행되어 현재 시각 주입
        this.createdAt = Instant.now();
    }
}
