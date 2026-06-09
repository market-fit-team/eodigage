package com.example.server.infrastructure.storage.media;

import com.example.server.core.media.MediaStoragePort;
import com.example.server.core.media.MediaUploadFile;
import com.example.server.core.media.StoredMediaObject;
import com.example.server.infrastructure.storage.config.S3StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class S3StorageService implements MediaStoragePort {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3StorageProperties properties;

    @Override
    public StoredMediaObject uploadImage(Long userId, MediaUploadFile file) {
        ImageDimensions dimensions = MediaUploadValidator.validate(file);
        String contentType = file.contentType();
        String objectKey = MediaObjectKeyGenerator.generate(userId, contentType);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .contentType(contentType)
                .contentLength(file.size())
                .metadata(Map.of(
                        "owner-user-id", String.valueOf(userId),
                        "original-filename", safeOriginalFilename(file.originalFilename())
                ))
                .build();

        try {
            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(file.inputStream(), file.size())
            );
        } catch (IOException e) {
            throw new IllegalStateException("S3 업로드 스트림을 읽는 데 실패했습니다.", e);
        }

        return new StoredMediaObject(
                properties.bucket(),
                objectKey,
                contentType,
                file.size(),
                dimensions.width(),
                dimensions.height()
        );
    }

    @Override
    public URL presignGetUrl(String objectKey) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(properties.presignedUrlExpirationSeconds()))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url();
    }

    @Override
    public void deleteObject(String objectKey) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .build());
    }

    private String safeOriginalFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "unknown";
        }
        return originalFilename.replaceAll("[\\r\\n]", "_");
    }
}
