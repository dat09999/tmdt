package com.example.backend.service.impl;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ObjectStorageService {

    private final MinioClient minio;

    public ObjectStorageService(MinioClient minio) {
        this.minio = minio;
    }

    public void putObject(String bucket, String key, MultipartFile file) throws Exception {
        minio.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(key)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );
    }

    // Neu bucket public: tu build URL.
    // Neu bucket private: doi sang presigned URL.
    public String getPublicUrlOrSignedUrl(String bucket, String key) {
        try {
            return minio.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(key)
                            .expiry(60 * 60) // 1 gio
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
