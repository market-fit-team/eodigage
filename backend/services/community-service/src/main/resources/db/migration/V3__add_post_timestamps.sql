-- V3: posts 테이블에 created_at, updated_at 추가 및 인덱스/트리거 설정
ALTER TABLE posts
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE posts
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- updated_at 컬럼을 자동으로 갱신하는 트리거 함수 정의
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 기존 트리거 제거 후 신규 트리거 등록
DROP TRIGGER IF EXISTS trg_posts_set_updated_at ON posts;

CREATE TRIGGER trg_posts_set_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 최신순 목록 및 커서 기반 페이지네이션의 속도 향상을 위한 복합 인덱스 추가
CREATE INDEX idx_posts_created_at_id_desc
ON posts (created_at DESC, id DESC);
