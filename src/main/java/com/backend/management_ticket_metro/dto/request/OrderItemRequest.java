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
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    private  String fromStationId;
    private String toStationId;
}
