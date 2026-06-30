from __future__ import annotations

from decimal import Decimal
from typing import Any

import httpx
from langchain_core.tools import tool

from agent.clients.market_service import market_service_client
from agent.services.chat.approvals.schemas import ApprovalDecisionType
from agent.services.chat.tools.tool_spec import ToolSpec

DECISIONS: list[ApprovalDecisionType] = ["approve", "edit", "reject", "respond"]
_MAX_AREAS = 10


def _trim_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _clamp_limit(limit: int) -> int:
    return max(1, min(limit, _MAX_AREAS))


def _string_or_none(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def _number_or_none(value: Any) -> int | float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return value
    if isinstance(value, Decimal):
        return float(value)
    return None


def _normalize_area(raw_area: Any) -> dict[str, Any] | None:
    if not isinstance(raw_area, dict):
        return None

    dong_code = _string_or_none(raw_area.get("dongCode"))
    center_lat = _number_or_none(raw_area.get("centerLat"))
    center_lng = _number_or_none(raw_area.get("centerLng"))
    if dong_code is None or center_lat is None or center_lng is None:
        return None

    return {
        "centerLat": center_lat,
        "centerLng": center_lng,
        "dongCode": dong_code,
        "dongName": _string_or_none(raw_area.get("dongName")) or dong_code,
        "estimatedSalesAmount": _number_or_none(raw_area.get("estimatedSalesAmount")),
        "industryCode": _string_or_none(raw_area.get("industryCode")),
        "industryName": _string_or_none(raw_area.get("industryName")),
        "rank": _number_or_none(raw_area.get("rank")),
        "sigunguCode": _string_or_none(raw_area.get("sigunguCode")) or "",
        "sigunguName": _string_or_none(raw_area.get("sigunguName")) or "",
    }


def _error_result(message: str) -> dict[str, Any]:
    return {
        "type": "map_area_search_results",
        "success": False,
        "error": message,
        "areas": [],
    }


@tool
async def market_search_areas(
    keyword: str,
    limit: int = 5,
) -> dict[str, Any]:
    """지도에 표시할 서울 행정동 상권 검색 결과를 조회합니다."""

    normalized_keyword = _trim_to_none(keyword)
    if normalized_keyword is None:
        return _error_result(
            "keyword는 필수입니다. 예: 을지로동, 신당동, 왕십리도선동, 성수1가1동"
        )

    try:
        payload = await market_service_client.search_areas(
            keyword=normalized_keyword,
            industry_code=None,
        )
    except httpx.HTTPStatusError as exc:
        return _error_result(
            f"market-service 검색 호출이 실패했습니다. status={exc.response.status_code}"
        )
    except (httpx.HTTPError, RuntimeError, ValueError):
        return _error_result("market-service 검색 호출에 실패했습니다.")

    raw_areas = payload.get("areas")
    raw_area_items = raw_areas if isinstance(raw_areas, list) else []
    areas = [
        area
        for area in (_normalize_area(raw_area) for raw_area in raw_area_items)
        if area is not None
    ][:_clamp_limit(limit)]

    return {
        "type": "map_area_search_results",
        "success": True,
        "keyword": _string_or_none(payload.get("keyword")),
        "industryCode": _string_or_none(payload.get("industryCode")),
        "industryName": _string_or_none(payload.get("industryName")),
        "periodKey": _string_or_none(payload.get("periodKey")),
        "stdrYyquCd": _string_or_none(payload.get("stdrYyquCd")),
        "areas": areas,
    }


MARKET_TOOL_SPECS: tuple[ToolSpec, ...] = (
    ToolSpec(
        tool=market_search_areas,
        name="market_search_areas",
        description=(
            "지도 화면에서 지역을 찾거나 지도에 표시할 상권 후보가 필요할 때 호출합니다. "
            "keyword에 행정동 이름을 넣으면 해당 지역의 행정동 목록을 반환합니다. 가령 '성수동'이 아닌 '성수1가1동', '성수' 와 같이 입력해야 합니다."
            '예: keyword="성수", keyword="을지로", keyword="신당동". '
            "결과의 areas는 지도 UI가 표시할 행정동 코드·이름·중심좌표입니다."
        ),
        category="rag",
        args_schema=market_search_areas.args_schema,
        default_allowed=True,
        allowed_decisions=DECISIONS,
    ),
)
