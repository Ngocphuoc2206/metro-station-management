package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.UploadFileResponse;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.service.S3_Storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Service
@Slf4j
public class MediaService {
    @Autowired
    private StorageService storageService;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    private static final long MAX_SIZE = 5 * 1024 * 1024;

    public UploadFileResponse uploadImage(MultipartFile file){
        log.info("Start upload image...");
        validate(file);

        String url = storageService.uploadFile(file, "metro-station-banners");

        return UploadFileResponse.builder()
                .fileName(file.getOriginalFilename())
                .url(url)
                .contentType(file.getContentType())
                .size(file.getSize())
                .build();
    }

    private void validate(MultipartFile file){
        if (file == null || file.isEmpty()){
            log.error(ErrorCode.INVALID_FILE.getMessage());
            throw new AppException(ErrorCode.INVALID_FILE);
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            log.error(ErrorCode.INVALID_FILE_TYPE.getMessage());
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        if (file.getSize() > MAX_SIZE) {
            log.error(ErrorCode.FILE_TOO_LARGE.getMessage());
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
    }
}
