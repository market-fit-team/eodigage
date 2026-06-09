package com.example.server.core.media;

import java.net.URL;

public interface MediaStoragePort {

    StoredMediaObject uploadImage(Long userId, MediaUploadFile file);

    URL presignGetUrl(String objectKey);

    void deleteObject(String objectKey);
}
