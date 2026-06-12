from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.testclient import TestClient
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from agent.core.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
    server_error_exception_handler,
)


class Payload(BaseModel):
    name: str


def build_client() -> TestClient:
    app = FastAPI()
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
    app.add_exception_handler(Exception, server_error_exception_handler)

    @app.get("/unauthorized")
    async def unauthorized() -> None:
        raise HTTPException(
            status_code=401,
            detail="invalid api key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    @app.post("/validate")
    async def validate(payload: Payload) -> Payload:
        return payload

    @app.get("/error")
    async def error() -> None:
        raise RuntimeError("boom")

    return TestClient(app, raise_server_exceptions=False)


def test_http_exception_uses_problem_detail_media_type_and_preserves_headers() -> None:
    client = build_client()

    response = client.get("/unauthorized")

    assert response.status_code == 401
    assert response.headers["content-type"] == "application/problem+json"
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json() == {
        "type": "about:blank",
        "title": "Unauthorized",
        "status": 401,
        "detail": "invalid api key",
        "instance": "/unauthorized",
    }


def test_validation_exception_uses_problem_detail_media_type() -> None:
    client = build_client()

    response = client.post("/validate", json={})

    assert response.status_code == 400
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json() == {
        "type": "about:blank",
        "title": "Bad Request",
        "status": 400,
        "detail": "body.name: Field required",
        "instance": "/validate",
    }


def test_server_error_exception_uses_problem_detail_media_type() -> None:
    client = build_client()

    response = client.get("/error")

    assert response.status_code == 500
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json() == {
        "type": "about:blank",
        "title": "Internal Server Error",
        "status": 500,
        "detail": "서버 내부 오류가 발생했습니다.",
        "instance": "/error",
    }
