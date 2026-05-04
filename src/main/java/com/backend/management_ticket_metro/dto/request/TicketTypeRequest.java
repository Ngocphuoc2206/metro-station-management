package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketTypeRequest {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private Double price;

    @NotNull
    private Integer validityDays;

    private Boolean isActive = true;
}
