# Media and S3-compatible Storage

이 서버는 게시글 이미지 업로드를 S3 호환 object storage에 저장하고, DB에는 media attachment metadata를 저장한다.

로컬 개발에서는 MinIO 같은 S3 compatible storage를 사용할 수 있다.

## 구성 요소

| 구성 요소                           | 위치                               | 역할                              |
| ----------------------------------- | ---------------------------------- | --------------------------------- |
| `MediaAttachmentController`         | `api/media`                        | HTTP upload/update/delete API     |
| `MediaAttachmentApplicationService` | `application/media`                | API request를 core service에 연결 |
| `MediaCommandService`               | `core/media`                       | 업로드/수정/삭제 command 처리     |
| `MediaStoragePort`                  | `core/media`                       | 저장소 추상화 port                |
| `S3StorageService`                  | `infrastructure/storage/media`     | S3 SDK 구현체                     |
| `MediaAttachmentRepository`         | `infrastructure/persistence/media` | DB persistence                    |
| `MediaUploadValidator`              | `infrastructure/storage/media`     | 파일 검증                         |
| `MediaObjectKeyGenerator`           | `infrastructure/storage/media`     | object key 생성                   |

## Storage 설정

```yaml
storage:
  s3:
    endpoint: ${S3_ENDPOINT:http://localhost:8900}
    region: ${S3_REGION:us-east-1}
    bucket: ${S3_BUCKET:pickle-post-images}
    access-key: ${S3_ACCESS_KEY:demo}
    secret-key: ${S3_SECRET_KEY:demo12345}
    path-style-access: ${S3_PATH_STYLE_ACCESS:true}
    presigned-url-expiration-seconds: ${S3_PRESIGNED_URL_EXPIRATION_SECONDS:600}
```

## 업로드 흐름

```text
POST /api/v1/media multipart/form-data
  -> MediaAttachmentController
     -> MediaAttachmentApplicationService
        -> MediaCommandService.upload
           -> MediaStoragePort.uploadImage
              -> S3StorageService uploads object
           -> MediaAttachment.uploaded(...)
           -> MediaAttachmentRepository.save
```

## MediaAttachment 상태

```text
UPLOADED -> ATTACHED -> DELETED
```

| 상태       | 의미                                          |
| ---------- | --------------------------------------------- |
| `UPLOADED` | 업로드는 되었지만 아직 게시글에 연결되지 않음 |
| `ATTACHED` | 게시글에 연결됨                               |
| `DELETED`  | 삭제 처리됨                                   |

게시글 생성 시 `mediaAttachmentIds`를 넘기면 `PostCommandService`가 업로드된 media를 게시글에 attach한다. 예약 게시글도 생성 시 같은 `PostDraft` 검증을 사용하고, 발행 시 `ScheduledPost.toPostDraft()`로 저장된 `mediaAttachmentIds`를 복원해 동일한 attach 로직을 탄다.

## DB Schema

테이블:

```text
post_media_attachments
```

주요 컬럼:

- `owner_user_id`
- `post_id`
- `bucket`
- `object_key`
- `original_filename`
- `content_type`
- `byte_size`
- `width`, `height`
- `alt_text`
- `status`
- `sort_order`
- `attached_at`
- `deleted_at`

## RLS 정책

- owner는 자신의 media를 조회/생성/수정할 수 있다.
- `ATTACHED`이고 삭제되지 않은 media는 공개 조회 가능하다.
- 삭제되지 않은 attached media는 게시글 응답에 포함된다.

## 파일 검증

미디어 업로드 검증은 다음 항목을 포함해야 한다.

- 파일 크기 제한
- MIME type 제한
- 이미지 dimension 추출 가능 여부
- 확장자 spoofing 방지
- 악성 파일 업로드 방지

현재 multipart 제한:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 45MB
```

## Presigned URL

S3 저장 객체는 직접 public bucket으로 노출하지 않고 presigned URL을 발급하는 방식이 안전하다. 현재 설정에는 presigned URL 만료 시간이 있다.

```yaml
storage.s3.presigned-url-expiration-seconds: 600
```

## API 사용 예시

```bash
curl -X POST http://localhost:8080/api/v1/media \
  -b cookies.txt \
  -H "X-XSRF-TOKEN: $TOKEN" \
  -F "file=@./image.webp" \
  -F "altText=대체 텍스트"
```

일반 게시글 생성 시:

```json
{
  "content": "이미지 포함 게시글",
  "mediaAttachmentIds": [100, 101]
}
```

## 확장 아이디어

- background thumbnail generation
- virus scanning
- orphan uploaded media cleanup scheduler
- CDN 연동
- 이미지 variant 저장
- alt text AI generation

## 참고 링크

- AWS SDK for Java S3 — https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html
- Amazon S3 Presigned URL — https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- MinIO Java SDK — https://min.io/docs/minio/linux/developers/java/minio-java.html
- Spring Multipart File Upload — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html


## 예약 게시글과 미디어

예약 게시글은 `scheduled_posts.media_attachment_ids`에 첨부 ID를 JSONB로 저장한다. 아직 실제 게시글이 만들어지지 않았기 때문에 예약 생성 시점에는 미디어를 게시글에 attach하지 않고, 발행 consumer가 아래 순서로 처리한다.

```text
ScheduledPostPublishConsumer
  -> scheduledPost.toPostDraft()
  -> PostCommandService.createRootFromScheduled(...) 또는 createReplyFromScheduled(...)
  -> attachMedia(post, user, draft.mediaAttachmentIds())
```

따라서 예약 발행 결과도 일반 게시글 작성과 동일하게 작성자 소유 여부, `UPLOADED` 상태, 최대 4개 제한, sort order 부여 규칙을 공유한다.
