package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.UploadFileResponse;
import com.backend.management_ticket_metro.service.MediaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    @Autowired
    private MediaService mediaService;

    @PostMapping(value = "/upload")
    public ApiResponse<UploadFileResponse> upload(@RequestParam("file") MultipartFile file) {
        return ApiResponse.<UploadFileResponse>builder()
                .results(mediaService.uploadImage(file))
                .build();
    }
}
