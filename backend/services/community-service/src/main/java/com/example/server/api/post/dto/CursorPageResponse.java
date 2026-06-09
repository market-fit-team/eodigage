package com.example.server.api.post.dto;

import java.util.List;

/**
 * 커서 기반 페이지네이션 처리 결과를 래핑하여 클라이언트에 무한 스크롤 컨트롤용 부가 정보를 함께 리턴하는 공용 레코드 DTO입니다.
 * @param <T> 페이징 리스트 내부 항목의 타입
 */
public record CursorPageResponse<T>(
        List<T> items,       // NOTE: 해당 페이지의 비즈니스 조회 결과 데이터 리스트
        String nextCursor,   // NOTE: 무한 스크롤에서 다음 구간(페이지)을 읽기 위해 백엔드에 제출할 암호화(Base64)된 커서 토큰값
        boolean hasNext      // NOTE: 다음 페이지 데이터가 추가적으로 더 존재하는지 여부 플래그
) {
}
