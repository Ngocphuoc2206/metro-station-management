package com.backend.management_ticket_metro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentCommentResponse {
    private String id;
    private String userId;
    private String userName;
    private String content;
    private LocalDateTime createdAt;
}