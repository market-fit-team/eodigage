# SSE Notifications

이 서버는 실시간 알림 전달에 Server-Sent Events(SSE)를 사용한다.

SSE는 서버에서 브라우저로 단방향 이벤트를 지속적으로 보내는 방식이다. 채팅처럼 양방향성이 강한 기능에는 WebSocket이 더 적합할 수 있지만, 알림 피드처럼 서버 push 중심인 기능에는 SSE가 단순하고 충분하다.

## Endpoint

```text
GET /api/v1/notifications/stream
Accept: text/event-stream
```

Controller:

```text
api/notification/NotificationStreamController.java
```

Service:

```text
application/notification/NotificationSseService.java
```

## 흐름

```text
Browser EventSource
  -> GET /api/v1/notifications/stream
     -> NotificationStreamController
        -> NotificationSseService creates SseEmitter
           -> store emitter by userId

NotificationCreatedEvent
  -> RabbitMQ
     -> NotificationDeliveryConsumer
        -> NotificationSseService.sendToUser(...)
           -> emitter.send(event)
```

## 브라우저 예시

```ts
const events = new EventSource(
  "http://localhost:8080/api/v1/notifications/stream",
  {
    withCredentials: true,
  },
);

events.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload);
};

events.onerror = () => {
  events.close();
};
```

주의:

- `withCredentials: true`가 필요하다.
- 서버 CORS에서 credentials를 허용해야 한다.
- EventSource는 custom header를 직접 넣기 어렵다. SSE endpoint는 GET이고 CSRF 대상이 아니다.

## SseEmitter 생명주기

Spring MVC에서는 `SseEmitter`를 사용한다.

고려할 이벤트:

- `onCompletion`: 연결 정상 종료
- `onTimeout`: timeout
- `onError`: 네트워크/전송 실패

연결 종료 시 emitter registry에서 제거해야 memory leak을 막을 수 있다.

## Notification Delivery Tracking

알림 전송 결과는 `notification_delivery_events` 테이블에 저장된다.

상태:

```text
SSE_SENT
STORED_ONLY
FAILED
```

의미:

- `SSE_SENT`: 실시간 연결로 전송 성공
- `STORED_ONLY`: SSE 연결이 없어서 DB에만 저장됨
- `FAILED`: 전송 중 오류 발생

사용자는 나중에 `GET /api/v1/notifications`로 저장된 알림을 다시 조회할 수 있다.

## SSE vs RabbitMQ

RabbitMQ와 SSE는 역할이 다르다.

| 기술     | 역할                            |
| -------- | ------------------------------- |
| RabbitMQ | 서버 내부 비동기 작업 전달      |
| SSE      | 서버에서 브라우저로 실시간 push |

즉 RabbitMQ는 backend-to-backend queue이고, SSE는 backend-to-client stream이다.

## 운영 주의사항

- Proxy/Nginx가 response buffering을 하지 않도록 설정한다.
- Load balancer 환경에서는 sticky session 또는 shared emitter strategy를 고려한다.
- SSE 연결 수가 많아질 경우 thread/resource 사용량을 모니터링한다.
- heartbeat event를 추가하면 중간 proxy idle timeout 대응에 도움이 된다.
- 브라우저 재연결 정책과 중복 알림 처리를 고려한다.

## 테스트 포인트

- 인증되지 않은 사용자는 stream 연결이 거부되는가?
- 로그인 사용자는 자신의 알림만 받는가?
- emitter가 없을 때 `STORED_ONLY` 처리되는가?
- emitter send 실패 시 `FAILED` 처리되는가?
- 알림 목록 조회로 누락된 알림을 복구할 수 있는가?

## 참고 링크

- Spring SseEmitter Javadoc — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html
- MDN Server-Sent Events — https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Baeldung: Server-Sent Events in Spring — https://www.baeldung.com/spring-server-sent-events
