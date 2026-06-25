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
@Table(name = "market_industry_sales")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketIndustrySaleEntity extends BaseTimeEntity {

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

    @Column(name = "thsmon_selng_amt")
    private Long thsmonSelngAmt;

    @Column(name = "thsmon_selng_co")
    private Long thsmonSelngCo;

    @Column(name = "mdwk_selng_amt")
    private Long mdwkSelngAmt;

    @Column(name = "wkend_selng_amt")
    private Long wkendSelngAmt;

    @Column(name = "mon_selng_amt")
    private Long monSelngAmt;

    @Column(name = "tues_selng_amt")
    private Long tuesSelngAmt;

    @Column(name = "wed_selng_amt")
    private Long wedSelngAmt;

    @Column(name = "thur_selng_amt")
    private Long thurSelngAmt;

    @Column(name = "fri_selng_amt")
    private Long friSelngAmt;

    @Column(name = "sat_selng_amt")
    private Long satSelngAmt;

    @Column(name = "sun_selng_amt")
    private Long sunSelngAmt;

    @Column(name = "tmzon_00_06_selng_amt")
    private Long tmzon0006SelngAmt;

    @Column(name = "tmzon_06_11_selng_amt")
    private Long tmzon0611SelngAmt;

    @Column(name = "tmzon_11_14_selng_amt")
    private Long tmzon1114SelngAmt;

    @Column(name = "tmzon_14_17_selng_amt")
    private Long tmzon1417SelngAmt;

    @Column(name = "tmzon_17_21_selng_amt")
    private Long tmzon1721SelngAmt;

    @Column(name = "tmzon_21_24_selng_amt")
    private Long tmzon2124SelngAmt;

    @Column(name = "ml_selng_amt")
    private Long mlSelngAmt;

    @Column(name = "fml_selng_amt")
    private Long fmlSelngAmt;

    @Column(name = "agrde_10_selng_amt")
    private Long agrde10SelngAmt;

    @Column(name = "agrde_20_selng_amt")
    private Long agrde20SelngAmt;

    @Column(name = "agrde_30_selng_amt")
    private Long agrde30SelngAmt;

    @Column(name = "agrde_40_selng_amt")
    private Long agrde40SelngAmt;

    @Column(name = "agrde_50_selng_amt")
    private Long agrde50SelngAmt;

    @Column(name = "agrde_60_above_selng_amt")
    private Long agrde60AboveSelngAmt;

    @Column(name = "mdwk_selng_co")
    private Long mdwkSelngCo;

    @Column(name = "wkend_selng_co")
    private Long wkendSelngCo;

    @Column(name = "mon_selng_co")
    private Long monSelngCo;

    @Column(name = "tues_selng_co")
    private Long tuesSelngCo;

    @Column(name = "wed_selng_co")
    private Long wedSelngCo;

    @Column(name = "thur_selng_co")
    private Long thurSelngCo;

    @Column(name = "fri_selng_co")
    private Long friSelngCo;

    @Column(name = "sat_selng_co")
    private Long satSelngCo;

    @Column(name = "sun_selng_co")
    private Long sunSelngCo;

    @Column(name = "tmzon_00_06_selng_co")
    private Long tmzon0006SelngCo;

    @Column(name = "tmzon_06_11_selng_co")
    private Long tmzon0611SelngCo;

    @Column(name = "tmzon_11_14_selng_co")
    private Long tmzon1114SelngCo;

    @Column(name = "tmzon_14_17_selng_co")
    private Long tmzon1417SelngCo;

    @Column(name = "tmzon_17_21_selng_co")
    private Long tmzon1721SelngCo;

    @Column(name = "tmzon_21_24_selng_co")
    private Long tmzon2124SelngCo;

    @Column(name = "ml_selng_co")
    private Long mlSelngCo;

    @Column(name = "fml_selng_co")
    private Long fmlSelngCo;

    @Column(name = "agrde_10_selng_co")
    private Long agrde10SelngCo;

    @Column(name = "agrde_20_selng_co")
    private Long agrde20SelngCo;

    @Column(name = "agrde_30_selng_co")
    private Long agrde30SelngCo;

    @Column(name = "agrde_40_selng_co")
    private Long agrde40SelngCo;

    @Column(name = "agrde_50_selng_co")
    private Long agrde50SelngCo;

    @Column(name = "agrde_60_above_selng_co")
    private Long agrde60AboveSelngCo;
}
