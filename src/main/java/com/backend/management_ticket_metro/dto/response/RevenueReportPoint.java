package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueReportPoint {
    private LocalDate date;
    private Double revenue;
    private Long orderCount;
}