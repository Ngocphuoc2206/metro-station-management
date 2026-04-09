package com.backend.management_ticket_metro.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StationResponse {
    private String stationId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String status;
}
