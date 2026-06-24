from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "trend-service"
    service_version: str = "0.1.0"
    frontend_origin: str = "http://localhost:3000"
    frontend_origin_alt: str = "http://127.0.0.1:3000"
    # sample: repo 동봉 합성 CSV(로컬/CI/오프라인), db: trend-db(Postgres) 실데이터
    data_mode: str = "sample"
    database_url: str = "postgresql+psycopg://trend:trend@trend-db:5432/trend"
    database_echo: bool = False
    # db 모드에서 테이블이 비어 있으면 .sample CSV를 한 번 적재할지 여부(부트스트랩)
    auto_ingest_sample_on_empty: bool = True
    # 부팅 시 학습 아티팩트가 없으면 자동 학습할지 여부
    bootstrap_train_if_missing: bool = True

    model_config = SettingsConfigDict(env_prefix="TREND_SERVICE_")


settings = Settings()
