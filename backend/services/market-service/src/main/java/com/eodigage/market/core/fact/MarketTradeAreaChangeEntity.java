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
@Table(name = "market_trade_area_changes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketTradeAreaChangeEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_id", nullable = false)
    private Long periodId;

    @Column(name = "dong_id", nullable = false)
    private Long dongId;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "ingest_batch_id")
    private Long ingestBatchId;

    @Column(name = "trdar_chnge_ix", length = 10)
    private String trdarChngeIx;

    @Column(name = "trdar_chnge_ix_nm", length = 100)
    private String trdarChngeIxNm;

    @Column(name = "opr_sale_mt_avrg", precision = 10, scale = 2)
    private BigDecimal oprSaleMtAvrg;

    @Column(name = "cls_sale_mt_avrg", precision = 10, scale = 2)
    private BigDecimal clsSaleMtAvrg;

    @Column(name = "su_opr_sale_mt_avrg", precision = 10, scale = 2)
    private BigDecimal suOprSaleMtAvrg;

    @Column(name = "su_cls_sale_mt_avrg", precision = 10, scale = 2)
    private BigDecimal suClsSaleMtAvrg;
}
