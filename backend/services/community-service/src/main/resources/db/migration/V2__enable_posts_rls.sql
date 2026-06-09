-- NOTE: [Flyway] V2 마이그레이션 - posts 테이블 RLS 활성화 및 보안 정책 수립

-- 1. 현재 로그인 사용자 ID를 조회하는 SQL 헬퍼 함수 정의
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::BIGINT
$$;

-- 2. posts 테이블 RLS(행 보안 정책) 활성화 및 테이블 소유자 강제 적용
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts FORCE ROW LEVEL SECURITY;

-- 3. SELECT 정책: 전체 공개 조회 허용
CREATE POLICY posts_select_all
ON posts
FOR SELECT
USING (true);

-- 4. INSERT 정책: 현재 로그인 유저 ID와 작성자 유저 ID가 일치해야 함
CREATE POLICY posts_insert_owner
ON posts
FOR INSERT
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);

-- 5. UPDATE 정책: 기존 데이터 작성자 및 신규 데이터 작성자 모두 본인이어야 함
CREATE POLICY posts_update_owner
ON posts
FOR UPDATE
USING (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
)
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);

-- 6. DELETE 정책: 데이터 작성자 본인만 행 삭제 허용
CREATE POLICY posts_delete_owner
ON posts
FOR DELETE
USING (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);
