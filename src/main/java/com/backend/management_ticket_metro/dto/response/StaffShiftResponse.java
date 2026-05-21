package com.backend.management_ticket_metro.dto.response;

import com.backend.management_ticket_metro.enums.ShiftStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffShiftResponse {
    private String shiftId;

    private String staffId;
    private String staffName;

    private String stationId;
    private String stationName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    private ShiftStatus status;
}
