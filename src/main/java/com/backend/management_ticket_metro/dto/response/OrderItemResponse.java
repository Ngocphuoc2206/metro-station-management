package com.backend.management_ticket_metro.dto.response;

import com.backend.management_ticket_metro.entity.TicketType;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private TicketType ticketType;
    private  Integer quantity;
    private Double unitprice;
    private Double subTotal;

    private StationResponse fromStation;
    private StationResponse toStation;
}
