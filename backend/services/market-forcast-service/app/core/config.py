from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "market-forcast-service"
    service_version: str = "0.1.0"
    artifact_dir: str = ".artifacts"
    raw_data_dir: str = ".raw"
    sample_data_dir: str = ".sample"
    processed_data_dir: str = "data/processed"

    model_config = SettingsConfigDict(env_prefix="MARKET_FORCAST_")


settings = Settings()

