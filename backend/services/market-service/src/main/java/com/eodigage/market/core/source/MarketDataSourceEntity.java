package com.eodigage.market.core.source;

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
@Table(name = "market_data_sources")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketDataSourceEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_code", nullable = false, unique = true, length = 100)
    private String sourceCode;

    @Column(name = "source_name", nullable = false)
    private String sourceName;

    @Column(nullable = false, length = 100)
    private String provider;

    @Column(name = "source_url", nullable = false, columnDefinition = "text")
    private String sourceUrl;

    @Column(name = "api_name", length = 150)
    private String apiName;

    @Column(columnDefinition = "text")
    private String description;
}
