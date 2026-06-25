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
@Table(name = "market_resident_populations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketResidentPopulationEntity extends BaseTimeEntity {

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

    @Column(name = "tot_repop_co")
    private Long totRepopCo;

    @Column(name = "ml_repop_co")
    private Long mlRepopCo;

    @Column(name = "fml_repop_co")
    private Long fmlRepopCo;

    @Column(name = "agrde_10_repop_co")
    private Long agrde10RepopCo;

    @Column(name = "agrde_20_repop_co")
    private Long agrde20RepopCo;

    @Column(name = "agrde_30_repop_co")
    private Long agrde30RepopCo;

    @Column(name = "agrde_40_repop_co")
    private Long agrde40RepopCo;

    @Column(name = "agrde_50_repop_co")
    private Long agrde50RepopCo;

    @Column(name = "agrde_60_above_repop_co")
    private Long agrde60AboveRepopCo;

    @Column(name = "mag_10_repop_co")
    private Long mag10RepopCo;

    @Column(name = "mag_20_repop_co")
    private Long mag20RepopCo;

    @Column(name = "mag_30_repop_co")
    private Long mag30RepopCo;

    @Column(name = "mag_40_repop_co")
    private Long mag40RepopCo;

    @Column(name = "mag_50_repop_co")
    private Long mag50RepopCo;

    @Column(name = "mag_60_above_repop_co")
    private Long mag60AboveRepopCo;

    @Column(name = "fag_10_repop_co")
    private Long fag10RepopCo;

    @Column(name = "fag_20_repop_co")
    private Long fag20RepopCo;

    @Column(name = "fag_30_repop_co")
    private Long fag30RepopCo;

    @Column(name = "fag_40_repop_co")
    private Long fag40RepopCo;

    @Column(name = "fag_50_repop_co")
    private Long fag50RepopCo;

    @Column(name = "fag_60_above_repop_co")
    private Long fag60AboveRepopCo;

    @Column(name = "tot_hshld_co")
    private Long totHshldCo;

    @Column(name = "apt_hshld_co")
    private Long aptHshldCo;

    @Column(name = "non_apt_hshld_co")
    private Long nonAptHshldCo;
}
