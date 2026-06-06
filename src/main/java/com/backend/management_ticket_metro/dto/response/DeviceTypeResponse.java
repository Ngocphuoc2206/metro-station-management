package com.backend.management_ticket_metro.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTypeResponse {
    private String id;
    private String typeName;
    private String description;
}