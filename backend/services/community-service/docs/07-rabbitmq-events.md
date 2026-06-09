# RabbitMQ Events

이 서버는 RabbitMQ를 비동기 이벤트 전달에 사용한다.

현재 주요 용도:

- 알림 delivery 비동기 처리
- 예약 게시글 발행 작업 queueing
- 실패 메시지 DLQ 보관

## 구성 파일

```text
infrastructure/messaging/config/RabbitConfig.java
```

## Exchange

| 이름                     | 타입           | 설명                                |
| ------------------------ | -------------- | ----------------------------------- |
| `pickly.events.exchange` | TopicExchange  | 애플리케이션 이벤트 발행용 exchange |
| `pickly.dlx.exchange`    | DirectExchange | dead-letter exchange                |

## Queue

| Queue                          | 설명                  | DLQ                          |
| ------------------------------ | --------------------- | ---------------------------- |
| `notification.delivery.queue`  | 알림 delivery 처리    | `notification.delivery.dlq`  |
| `post.scheduled.publish.queue` | 예약 게시글 발행 처리 | `post.scheduled.publish.dlq` |

## Routing Key

| Routing Key                     | 설명                   |
| ------------------------------- | ---------------------- |
| `notification.comment.created`  | 댓글 알림 생성         |
| `notification.like.created`     | 좋아요 알림 생성       |
| `post.scheduled.publish`        | 예약 게시글 발행       |
| `notification.delivery.failed`  | 알림 delivery 실패 DLQ |
| `post.scheduled.publish.failed` | 예약 발행 실패 DLQ     |

## Message Converter

RabbitMQ 메시지는 Jackson JSON converter를 사용한다.

```java
@Bean
MessageConverter messageConverter(ObjectMapper objectMapper) {
    return new Jackson2JsonMessageConverter(objectMapper);
}
```

## 알림 이벤트 흐름

```text
PostCommandService / PostLikeCommandService
  -> NotificationCommandService
     -> Notification entity 저장
     -> publish NotificationCreatedEvent
        -> NotificationRabbitPublisher
           -> RabbitMQ pickly.events.exchange
              routing key notification.comment.created / notification.like.created
              -> notification.delivery.queue
                 -> NotificationDeliveryConsumer
                    -> NotificationSseService
                    -> NotificationDeliveryEvent 저장
```

## 예약 게시글 이벤트 흐름

```text
ScheduledPostCommandService
  -> scheduled_posts row 생성
  -> ScheduledPostPublisherScheduler scans due rows
  -> RabbitMQ pickly.events.exchange
     routing key post.scheduled.publish
     -> post.scheduled.publish.queue
        -> ScheduledPostPublishConsumer
           -> PostCommandService createRootFromScheduled/createReplyFromScheduled
           -> ScheduledPost status update
```

## DLQ 전략

Queue는 dead-letter exchange를 가진다.

```java
QueueBuilder.durable(NOTIFICATION_DELIVERY_QUEUE)
    .deadLetterExchange(DLX_EXCHANGE)
    .deadLetterRoutingKey("notification.delivery.failed")
    .build();
```

실패 메시지가 무한 재시도되지 않도록 다음 설정을 사용한다.

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        default-requeue-rejected: false
```

## Consumer 작성 규칙

- Consumer는 idempotent하게 작성한다.
- DB 상태 전이를 먼저 검증한다.
- 실패 사유를 저장할 수 있으면 저장한다.
- 메시지 schema 변경 시 backward compatibility를 고려한다.
- 재처리 가능한 실패와 영구 실패를 구분한다.
- DLQ 모니터링 방법을 운영 문서에 추가한다.

## 메시지 DTO 위치

RabbitMQ message class는 HTTP DTO가 아니므로 `api/**/dto`에 두지 않는다.

현재 위치:

```text
infrastructure/messaging/notification/NotificationDeliveryMessage.java
infrastructure/messaging/scheduledpost/ScheduledPostPublishMessage.java
```

## 로컬 확인

RabbitMQ Management UI를 사용한다면 일반적으로 다음 URL에서 queue와 message를 확인한다.

```text
http://localhost:15672
```

기본 계정은 로컬 compose 설정에 따라 다르지만 `guest/guest`를 많이 사용한다.

## 참고 링크

- RabbitMQ Official — https://www.rabbitmq.com/
- Spring Guide: Messaging with RabbitMQ — https://spring.io/guides/gs/messaging-rabbitmq
- Spring AMQP Reference — https://docs.spring.io/spring-amqp/reference/
