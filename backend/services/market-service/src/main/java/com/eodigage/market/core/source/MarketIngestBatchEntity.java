package com.eodigage.market.core.source;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "market_ingest_batches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketIngestBatchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "requested_path", columnDefinition = "text")
    private String requestedPath;

    @Column(name = "result_code", length = 50)
    private String resultCode;

    @Column(name = "result_message", columnDefinition = "text")
    private String resultMessage;

    @Column(name = "fetched_count")
    private Integer fetchedCount;

    @Column(name = "fetched_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime fetchedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
