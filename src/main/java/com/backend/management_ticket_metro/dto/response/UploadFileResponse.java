package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UploadFileResponse {
    private String fileName;
    private String url;
    private String contentType;
    private long size;
}
