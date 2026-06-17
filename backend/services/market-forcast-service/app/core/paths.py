from __future__ import annotations

from pathlib import Path

from app.core.config import settings

SERVICE_ROOT = Path(__file__).resolve().parents[2]
RAW_DATA_DIR = SERVICE_ROOT / settings.raw_data_dir
SAMPLE_DATA_DIR = SERVICE_ROOT / settings.sample_data_dir
PROCESSED_DATA_DIR = SERVICE_ROOT / settings.processed_data_dir
ARTIFACT_DIR = SERVICE_ROOT / settings.artifact_dir

