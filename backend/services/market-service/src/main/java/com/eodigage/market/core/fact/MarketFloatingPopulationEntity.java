package com.eodigage.market.core.fact;

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
@Table(name = "market_floating_populations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketFloatingPopulationEntity extends BaseTimeEntity {

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

    @Column(name = "tot_flpop_co")
    private Long totFlpopCo;

    @Column(name = "ml_flpop_co")
    private Long mlFlpopCo;

    @Column(name = "fml_flpop_co")
    private Long fmlFlpopCo;

    @Column(name = "agrde_10_flpop_co")
    private Long agrde10FlpopCo;

    @Column(name = "agrde_20_flpop_co")
    private Long agrde20FlpopCo;

    @Column(name = "agrde_30_flpop_co")
    private Long agrde30FlpopCo;

    @Column(name = "agrde_40_flpop_co")
    private Long agrde40FlpopCo;

    @Column(name = "agrde_50_flpop_co")
    private Long agrde50FlpopCo;

    @Column(name = "agrde_60_above_flpop_co")
    private Long agrde60AboveFlpopCo;

    @Column(name = "tmzon_00_06_flpop_co")
    private Long tmzon0006FlpopCo;

    @Column(name = "tmzon_06_11_flpop_co")
    private Long tmzon0611FlpopCo;

    @Column(name = "tmzon_11_14_flpop_co")
    private Long tmzon1114FlpopCo;

    @Column(name = "tmzon_14_17_flpop_co")
    private Long tmzon1417FlpopCo;

    @Column(name = "tmzon_17_21_flpop_co")
    private Long tmzon1721FlpopCo;

    @Column(name = "tmzon_21_24_flpop_co")
    private Long tmzon2124FlpopCo;

    @Column(name = "mon_flpop_co")
    private Long monFlpopCo;

    @Column(name = "tues_flpop_co")
    private Long tuesFlpopCo;

    @Column(name = "wed_flpop_co")
    private Long wedFlpopCo;

    @Column(name = "thur_flpop_co")
    private Long thurFlpopCo;

    @Column(name = "fri_flpop_co")
    private Long friFlpopCo;

    @Column(name = "sat_flpop_co")
    private Long satFlpopCo;

    @Column(name = "sun_flpop_co")
    private Long sunFlpopCo;
}
