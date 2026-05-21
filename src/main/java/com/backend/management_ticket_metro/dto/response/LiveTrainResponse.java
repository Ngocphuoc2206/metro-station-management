package com.backend.management_ticket_metro.dto.response;

import com.backend.management_ticket_metro.enums.TrainDirection;
import com.backend.management_ticket_metro.enums.TrainStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveTrainResponse {
    private String trainId;
    private String trainCode;
    private String routeId;
    private String currentStationId;
    private String nextStationId;
    private TrainDirection direction;
    private TrainStatus status;
    private Integer delayMinutes;
    private Double lat;
    private Double lng;
    private LocalDateTime updatedAt;
}
