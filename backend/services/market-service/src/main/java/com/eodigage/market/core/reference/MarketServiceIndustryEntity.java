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
@Table(name = "market_service_industries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketServiceIndustryEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "svc_induty_cd", nullable = false, unique = true, length = 50)
    private String svcIndutyCd;

    @Column(name = "svc_induty_cd_nm", nullable = false, length = 100)
    private String svcIndutyCdNm;

    @Column(nullable = false)
    private Boolean active;
}
