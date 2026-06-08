package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripsReportPoint {
    private LocalDate date;
    private Long completedTrips;
    private Long inProgressTrips;
    private Long incompleteTrips;
}