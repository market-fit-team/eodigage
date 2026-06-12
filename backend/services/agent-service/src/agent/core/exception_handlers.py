import logging
import traceback
from collections.abc import Mapping
from http import HTTPStatus

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.utils import is_body_allowed_for_status_code
from starlette.exceptions import HTTPException as StarletteHTTPException

from agent.schemas.problem_detail import ProblemDetail

logger = logging.getLogger(__name__)
PROBLEM_JSON_MEDIA_TYPE = "application/problem+json"


def _problem_detail_response(
    status_code: int,
    problem_detail: ProblemDetail,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=problem_detail.model_dump(exclude_none=True),
        headers=headers,
        media_type=PROBLEM_JSON_MEDIA_TYPE,
    )


async def http_exception_handler(request: Request, exc: Exception) -> Response:
    if not isinstance(exc, StarletteHTTPException):
        raise TypeError("http_exception_handler requires StarletteHTTPException")

    headers = exc.headers

    if not is_body_allowed_for_status_code(exc.status_code):
        return Response(status_code=exc.status_code, headers=headers)

    detail = exc.detail
    try:
        title = HTTPStatus(exc.status_code).phrase
    except ValueError:
        title = "Error"

    return _problem_detail_response(
        status_code=exc.status_code,
        problem_detail=ProblemDetail(
            status=exc.status_code,
            title=title,
            detail=detail,
            instance=request.url.path,
        ),
        headers=headers,
    )


async def request_validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise TypeError("request_validation_exception_handler requires RequestValidationError")

    errors = exc.errors()
    messages = []
    for error in errors:
        loc = ".".join(str(part) for part in error.get("loc", []))
        msg = error.get("msg", "")
        messages.append(f"{loc}: {msg}")

    detail = ", ".join(messages) if messages else "요청 파라미터 검증에 실패했습니다."

    return _problem_detail_response(
        status_code=status.HTTP_400_BAD_REQUEST,
        problem_detail=ProblemDetail(
            status=status.HTTP_400_BAD_REQUEST,
            title="Bad Request",
            detail=detail,
            instance=request.url.path,
        ),
    )


async def server_error_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled Exception at %s %s: %s\n%s",
        request.method,
        request.url.path,
        exc,
        traceback.format_exc(),
    )
    return _problem_detail_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        problem_detail=ProblemDetail(
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            title="Internal Server Error",
            detail="서버 내부 오류가 발생했습니다.",
            instance=request.url.path,
        ),
    )
