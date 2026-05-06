package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    @NotEmpty(message = "Items list cannot be empty")
    private List<OrderItemRequest> items;
}
