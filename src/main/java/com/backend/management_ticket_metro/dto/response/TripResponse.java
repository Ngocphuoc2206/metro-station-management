package com.backend.management_ticket_metro.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TripResponse {
    private String id;
    private String ticketId;
    private String originStation;
    private String destinationStation;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private String status;
}
