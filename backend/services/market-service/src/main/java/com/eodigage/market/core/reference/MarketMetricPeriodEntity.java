package com.eodigage.market.core.reference;

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
@Table(name = "market_metric_periods")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketMetricPeriodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_key", nullable = false, unique = true, length = 20)
    private String periodKey;

    @Column(name = "stdr_yyqu_cd", nullable = false, unique = true, length = 20)
    private String stdrYyquCd;

    @Column
    private Integer year;

    @Column
    private Integer quarter;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
