package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.IncidentPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IncidentRequest {
    private String title;
    private String description;
    private String stationId;
    private String gateId;
    private String deviceId;
    private IncidentPriority priority;
}