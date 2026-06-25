package com.eodigage.market.core.reference;

import java.math.BigDecimal;

import com.eodigage.market.core.common.BaseTimeEntity;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "market_admin_dong_boundaries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketAdminDongBoundaryEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "base_date", nullable = false, length = 8)
    private String baseDate;

    @Column(name = "adm_dr_cd", nullable = false, unique = true, length = 8)
    private String admDrCd;

    @Column(name = "adm_dr_nm", nullable = false, length = 50)
    private String admDrNm;

    @Column(name = "sigungu_id")
    private Long sigunguId;

    @Column(nullable = false, length = 50)
    private String sido;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "ingest_batch_id")
    private Long ingestBatchId;

    @Column(name = "center_lat", precision = 10, scale = 7)
    private BigDecimal centerLat;

    @Column(name = "center_lng", precision = 10, scale = 7)
    private BigDecimal centerLng;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "boundary_geojson", columnDefinition = "jsonb")
    private JsonNode boundaryGeojson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "boundary_simplified_geojson", columnDefinition = "jsonb")
    private JsonNode boundarySimplifiedGeojson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_properties_json", columnDefinition = "jsonb")
    private JsonNode rawPropertiesJson;
}
