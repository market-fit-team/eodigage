-- 통합 테스트 애플리케이션 전용 non-superuser 계정을 만든다.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user
            LOGIN
            PASSWORD 'app_user_pw'
            NOSUPERUSER
            NOBYPASSRLS
            NOCREATEDB
            NOCREATEROLE;
    END IF;
END
$$;

-- app_user로 Flyway migration을 수행할 수 있도록 기본 권한을 부여한다.
GRANT CONNECT ON DATABASE test TO app_user;
GRANT USAGE, CREATE ON SCHEMA public TO app_user;
