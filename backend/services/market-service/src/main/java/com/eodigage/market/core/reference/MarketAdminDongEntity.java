package com.eodigage.market.core.reference;

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
@Table(name = "market_admin_dongs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketAdminDongEntity extends BaseTimeEntity {

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

}
