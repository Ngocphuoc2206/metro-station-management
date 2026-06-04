package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FareMatrixRequest {
    @NotBlank
    private String originStationId;

    @NotBlank
    private String destinationStationId;

    @NotNull
    private Double price;

    // distance both of two stations
    private Double distanceOfTwoStations;
}