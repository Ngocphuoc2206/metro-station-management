package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardSummaryResponse {
    private Double totalRevenue;
    private Long totalTicketsSold;
    private Long totalTripsCompleted;
    private Long activeIncidentsCount;
    private Long totalErrorDevicesCount;
    private Map<String, Long> ticketsByType; // E.g., {"Single": 120, "Daily": 45, "Month": 12}
}