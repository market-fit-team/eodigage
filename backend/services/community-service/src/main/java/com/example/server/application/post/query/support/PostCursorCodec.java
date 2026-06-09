package com.example.server.application.post.query.support;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import org.springframework.stereotype.Component;

@Component // NOTE: [Spring] 빈 등록을 위해 컴포넌트 선언
public class PostCursorCodec {

    private static final String DELIMITER = "|"; // NOTE: 생성 시각과 식별 ID를 구분하기 위한 고유 구분자 지정

    /**
     * 최종 게시글의 생성 시각과 고유 ID 값을 조합하여 Base64 형태의 URL-Safe 커서 토큰으로 인코딩합니다.
     * @param createdAt 생성 시각
     * @param id        게시글 고유 ID
     * @return 암호화(Base64)되어 클라이언트에 전달될 커서 문자열
     */
    public String encode(Instant createdAt, Long id) {
        // NOTE: '시각문자열|식별ID' 구조의 단일 문자열 생성
        String raw = createdAt.toString() + DELIMITER + id;
        // NOTE: URL에 특수문자 문제를 유발하지 않도록 URL-Safe 및 패딩 제거 옵션의 Base64 인코더 활용
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 클라이언트가 전달한 Base64 형식의 커서 문자열을 파싱하여 정렬 원천 정보(Instant, Long)인 CursorToken으로 변환합니다.
     * @param cursor 클라이언트가 전달한 커서 문자열 (null 혹은 공백일 수 있음)
     * @return 파싱된 내부 CursorToken 정보 객체
     */
    public CursorToken decode(String cursor) {
        // NOTE: 첫 페이지 조회를 위해 커서 값이 유효하지 않은 경우, null을 품은 첫 페이지 상태의 토큰 반환
        if (cursor == null || cursor.isBlank()) {
            return CursorToken.firstPage();
        }

        try {
            // NOTE: URL-Safe Base64 디코딩 수행 후 UTF-8 규격의 일반 텍스트로 변환
            String raw = new String(
                    Base64.getUrlDecoder().decode(cursor),
                    StandardCharsets.UTF_8
            );

            // NOTE: 구분자 기호인 "|" 기준으로 문자열을 분할
            String[] parts = raw.split("\\|", 2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("잘못된 cursor 형식입니다.");
            }

            // NOTE: 복원된 정보 바탕으로 인스턴스 반환
            return new CursorToken(
                    Instant.parse(parts[0]),
                    Long.valueOf(parts[1])
            );
        } catch (RuntimeException ex) {
            // NOTE: 클라이언트가 변조된 인코딩 값을 주입하는 상황 등에 대응하여 유효하지 않음을 명시적으로 알림
            throw new IllegalArgumentException("유효하지 않은 cursor입니다.", ex);
        }
    }

    /**
     * 파싱된 커서의 상태 값들을 래핑하여 보존하는 구조의 내부 Record 클래스입니다.
     */
    public record CursorToken(
            Instant createdAt, // NOTE: 타깃 게시글 생성 시각
            Long id            // NOTE: 타깃 게시글 ID
    ) {
        /**
         * 커서가 없어 최초 1페이지 조회를 요구할 시점의 빈 CursorToken 객체를 발급해주는 유틸 메소드입니다.
         * @return 첫 페이지용 빈 토큰 객체
         */
        public static CursorToken firstPage() {
            return new CursorToken(null, null);
        }

        /**
         * 첫 페이지 조회인지 여부를 체크합니다.
         * @return 첫 페이지인 경우 true, 그렇지 않은 경우 false
         */
        public boolean isFirstPage() {
            return createdAt == null || id == null;
        }
    }
}
