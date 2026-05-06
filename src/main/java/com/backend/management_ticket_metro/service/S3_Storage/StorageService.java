package com.backend.management_ticket_metro.service.S3_Storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(MultipartFile file, String folder);
    String uploadBytes(byte[] data, String fileName, String contentFile, String folder);
}
