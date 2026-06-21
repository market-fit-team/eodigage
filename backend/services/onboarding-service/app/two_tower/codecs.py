from __future__ import annotations

from string import digits, ascii_uppercase
from typing import Any

from app.models.onboarding_two_tower.user_profiles import CATEGORY_OPTIONS, USER_NUMERIC_FIELDS
from app.two_tower.contracts import UserProfilePayload

BASE36_ALPHABET = digits + ascii_uppercase
PROFILE_CODE_PREFIX = "r"
PROFILE_CODE_VERSION = 1
SHARED_PROFILE_NAME = "공유 코드 프로필"

_CATEGORY_INDEX_BY_CODE = {option["code"]: index for index, option in enumerate(CATEGORY_OPTIONS)}


class InvalidProfileCodeError(ValueError):
    """프로필 공유 코드 형식이 잘못됐을 때 사용한다."""


def _int_to_base36(value: int, width: int = 1) -> str:
    if value < 0:
        raise ValueError("base36 변환 대상은 0 이상이어야 한다.")
    encoded = ""
    current = value
    if current == 0:
        encoded = "0"
    while current > 0:
        current, remainder = divmod(current, 36)
        encoded = BASE36_ALPHABET[remainder] + encoded
    return encoded.rjust(width, "0")


def _base36_to_int(value: str) -> int:
    try:
        return int(value, 36)
    except ValueError as error:
        raise InvalidProfileCodeError("base36 문자열을 해석하지 못했다.") from error


def _encode_score_group(scores: list[int]) -> str:
    value = 0
    for score in scores:
        normalized = int(score) - 1
        if normalized < 0 or normalized > 4:
            raise InvalidProfileCodeError("점수는 1에서 5 사이여야 한다.")
        value = (value * 5) + normalized
    return _int_to_base36(value, width=2)


def _decode_score_group(chunk: str) -> list[int]:
    value = _base36_to_int(chunk)
    if value < 0 or value >= 125:
        raise InvalidProfileCodeError("점수 그룹 범위를 벗어난 코드다.")
    decoded = [0, 0, 0]
    current = value
    for index in range(2, -1, -1):
        current, remainder = divmod(current, 5)
        decoded[index] = remainder + 1
    return decoded


def build_share_path(profile_code: str) -> str:
    return f"/example/two-tower/{profile_code}"


def encode_profile_code(profile: UserProfilePayload | dict[str, Any]) -> str:
    payload = UserProfilePayload.model_validate(profile).model_dump()
    category_index = _CATEGORY_INDEX_BY_CODE.get(payload["preferred_category_code"])
    if category_index is None:
        raise InvalidProfileCodeError("등록되지 않은 업종 코드는 공유 코드로 변환할 수 없다.")

    chunks = []
    for offset in range(0, len(USER_NUMERIC_FIELDS), 3):
        # 9개 점수를 3개씩 묶어 2글자 base36로 줄이면 URL 공유 코드가 짧아진다.
        field_names = USER_NUMERIC_FIELDS[offset : offset + 3]
        chunks.append(_encode_score_group([int(payload[name]) for name in field_names]))

    return (
        f"{PROFILE_CODE_PREFIX}"
        f"{_int_to_base36(PROFILE_CODE_VERSION)}"
        f"{_int_to_base36(category_index)}"
        f"{''.join(chunks)}"
    )


def decode_profile_code(profile_code: str) -> dict[str, Any]:
    normalized = profile_code.strip().upper()
    if len(normalized) != 9 or not normalized.startswith(PROFILE_CODE_PREFIX.upper()):
        raise InvalidProfileCodeError("공유 코드 길이 또는 접두사가 올바르지 않다.")

    version = _base36_to_int(normalized[1])
    if version != PROFILE_CODE_VERSION:
        raise InvalidProfileCodeError("지원하지 않는 공유 코드 버전이다.")

    category_index = _base36_to_int(normalized[2])
    if category_index >= len(CATEGORY_OPTIONS):
        raise InvalidProfileCodeError("업종 인덱스가 범위를 벗어났다.")

    decoded_scores: list[int] = []
    for start in range(3, 9, 2):
        decoded_scores.extend(_decode_score_group(normalized[start : start + 2]))

    category_code = CATEGORY_OPTIONS[category_index]["code"]
    payload: dict[str, Any] = {
        "user_id": f"shared_{normalized.lower()}",
        "profile_name": SHARED_PROFILE_NAME,
        "preferred_category_code": category_code,
    }
    for field_name, value in zip(USER_NUMERIC_FIELDS, decoded_scores, strict=True):
        payload[field_name] = value
    return UserProfilePayload.model_validate(payload).model_dump()
