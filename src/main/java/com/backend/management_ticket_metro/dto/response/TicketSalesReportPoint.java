package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketSalesReportPoint {
    private LocalDate date;
    private String ticketTypeName;
    private Long quantitySold;
    private Double amount;
}