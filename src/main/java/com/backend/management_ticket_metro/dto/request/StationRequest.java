package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.StationStatus;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StationRequest {
    @NotBlank(message = "station name required")
    @Size(min = 3, max = 100, message = "STATION_NAME_INVALID_SIZE")
    private String name;

    @NotBlank(message = "address is required")
    private String address;


    @NotNull(message = "latitude is required")
    @DecimalMin(value = "-90.0", message = "LATITUDE_INVALID")
    @DecimalMax(value = "90.0", message = "LATITUDE_INVALID")
    private Double latitude;

    @NotNull(message = "longitude is required")
    @DecimalMin(value = "-180.0", message = "LONGITUDE_INVALID")
    @DecimalMax(value = "180.0", message = "LONGITUDE_INVALID")
    private Double longitude;

    @NotNull(message = "station status is required")
    private StationStatus status;
}
