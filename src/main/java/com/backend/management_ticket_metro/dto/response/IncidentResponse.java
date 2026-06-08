package com.backend.management_ticket_metro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {
    private String id;
    private String title;
    private String description;
    private String stationId;
    private String stationName;
    private String gateId;
    private String gateCode;
    private String deviceId;
    private String deviceCode;
    private String priority;
    private String status;
    private String reporterName;
    private String assigneeName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<IncidentCommentResponse> comments;
    private String attachmentUrl;
}