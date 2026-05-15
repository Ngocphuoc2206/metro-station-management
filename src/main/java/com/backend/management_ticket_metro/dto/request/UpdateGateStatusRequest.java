package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.GateStatus;
import lombok.Data;

@Data
public class UpdateGateStatusRequest {
    private GateStatus status;
}
