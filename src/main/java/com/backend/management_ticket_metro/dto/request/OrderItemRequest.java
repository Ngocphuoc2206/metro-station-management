package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    private String ticketTypeId;
    private Integer quantity;
    private  String fromStationId;
    private String toStationId;
    private Double distance;
}
