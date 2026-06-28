from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base

_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    """엔진을 지연 생성한다. sample 모드에선 호출되지 않아 DB 연결이 없어도 된다."""
    global _engine, _SessionLocal
    if _engine is None:
        _engine = create_engine(settings.database_url, echo=settings.database_echo, future=True)
        _SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False, class_=Session)
    return _engine


def session_scope() -> Session:
    get_engine()
    assert _SessionLocal is not None
    return _SessionLocal()


def prepare_database() -> None:
    """테이블을 만들고, 설정이 켜져 있으면 행정동 이름 CSV를 한 번 적재한다.

    ingest는 model 스택(pandas)을 끌어오므로, 슬림 API 부팅이 이를 임포트하지 않도록
    실제 적재가 필요한 분기 안에서만 지연 임포트한다(운영은 auto_ingest=false).
    """
    from app.trend.repository import is_hdong_area_empty

    Base.metadata.create_all(get_engine())
    if settings.auto_ingest_sample_on_empty and is_hdong_area_empty():
        from app.trend.ingest import ingest_bootstrap_into_db

        ingest_bootstrap_into_db()


def dispose_database() -> None:
    global _engine
    if _engine is not None:
        _engine.dispose()
        _engine = None
