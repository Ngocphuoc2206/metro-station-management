package com.backend.management_ticket_metro.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private String ticketTypeId;
    private  Integer quantity;
    private Double unitprice;
    private Double subTotal;

    private StationResponse fromStation;
    private StationResponse toStation;
}
