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
        try {
            boolean found = minio.bucketExists(io.minio.BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                minio.makeBucket(io.minio.MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception ignored) {
        }

        minio.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(key)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType() != null ? file.getContentType() : "image/jpeg")
                        .build()
        );
    }

    public byte[] getObjectBytes(String bucket, String key) {
        try (var response = minio.getObject(
                io.minio.GetObjectArgs.builder()
                        .bucket(bucket)
                        .object(key)
                        .build()
        )) {
            return response.readAllBytes();
        } catch (Exception e) {
            return null;
        }
    }

    // Tra ve endpoint proxy tren Backend de browser luon tai duoc anh an toan (HTTPS, no CORS)
    public String getPublicUrlOrSignedUrl(String bucket, String key) {
        if (key == null || key.isBlank()) return "";
        if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("data:")) {
            return key;
        }
        return "/api/files/" + bucket + "/" + key;
    }
}
