package com.backend.management_ticket_metro.dto.response;

import com.backend.management_ticket_metro.enums.StationLiveStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveStationStatusResponse {
    private String stationId;
    private StationLiveStatus status;
    private Integer congestionLevel;
    private String message;
    private LocalDateTime updatedAt;
}
