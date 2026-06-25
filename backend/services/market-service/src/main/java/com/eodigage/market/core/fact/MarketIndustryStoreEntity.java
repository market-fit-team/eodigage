package com.eodigage.market.core.fact;

import java.math.BigDecimal;

import com.eodigage.market.core.common.BaseTimeEntity;

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
@Table(name = "market_industry_stores")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketIndustryStoreEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_id", nullable = false)
    private Long periodId;

    @Column(name = "dong_id", nullable = false)
    private Long dongId;

    @Column(name = "industry_id", nullable = false)
    private Long industryId;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "ingest_batch_id")
    private Long ingestBatchId;

    @Column(name = "similr_induty_stor_co")
    private Long similrIndutyStorCo;

    @Column(name = "stor_co")
    private Long storCo;

    @Column(name = "frc_stor_co")
    private Long frcStorCo;

    @Column(name = "opbiz_rt", precision = 8, scale = 3)
    private BigDecimal opbizRt;

    @Column(name = "opbiz_stor_co")
    private Long opbizStorCo;

    @Column(name = "clsbiz_rt", precision = 8, scale = 3)
    private BigDecimal clsbizRt;

    @Column(name = "clsbiz_stor_co")
    private Long clsbizStorCo;
}
