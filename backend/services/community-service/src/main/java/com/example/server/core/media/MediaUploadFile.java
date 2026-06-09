package com.example.server.core.media;

import java.io.IOException;
import java.io.InputStream;

public interface MediaUploadFile {

    String originalFilename();

    String contentType();

    long size();

    InputStream inputStream() throws IOException;
}
