package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.StaffShiftResponse;
import com.backend.management_ticket_metro.entity.StaffShift;
import com.backend.management_ticket_metro.enums.ShiftStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.StaffShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StaffShiftService {
    private final StaffShiftRepository staffShiftRepository;

    @Transactional(readOnly = true)
    public StaffShiftResponse getCurrentShift(){
        String email = getCurrentUserEmail();
        LocalDateTime now = LocalDateTime.now();

        StaffShift staffShift = staffShiftRepository
                .findFirstByStaff_EmailAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByStartTimeDesc
                        (email, now, now).orElseThrow(() -> new AppException(ErrorCode.SHIFT_NOT_FOUND));

        return toResponse(staffShift);
    }

    @Transactional(readOnly = true)
    public List<StaffShiftResponse> getWeeklyShifts() {
        String email = getCurrentUserEmail();

        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = startOfWeek.plusWeeks(1);

        LocalDateTime from = startOfWeek.atStartOfDay();
        LocalDateTime to = endOfWeek.atStartOfDay();

        return staffShiftRepository
                .findByStaff_EmailAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
                        email,
                        from,
                        to
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StaffShiftResponse checkIn() {
        String email = getCurrentUserEmail();
        LocalDateTime now = LocalDateTime.now();

        StaffShift shift = staffShiftRepository
                .findFirstByStaff_EmailAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByStartTimeDesc(
                        email,
                        now,
                        now
                )
                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_NOT_FOUND));

        if (shift.getStatus() == ShiftStatus.CANCELLED || shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new AppException(ErrorCode.INVALID_SHIFT_STATUS);
        }

        if (shift.getCheckInTime() != null) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_CHECKED_IN);
        }

        shift.setCheckInTime(now);
        shift.setStatus(ShiftStatus.IN_PROGRESS);

        return toResponse(staffShiftRepository.save(shift));
    }

    @Transactional
    public StaffShiftResponse checkOut() {
        String email = getCurrentUserEmail();
        LocalDateTime now = LocalDateTime.now();

        StaffShift shift = staffShiftRepository
                .findFirstByStaff_EmailAndStatusOrderByStartTimeDesc(email, ShiftStatus.IN_PROGRESS)
                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_NOT_CHECKED_IN));

        if (shift.getCheckOutTime() != null) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_CHECKED_OUT);
        }

        shift.setCheckOutTime(now);
        shift.setStatus(ShiftStatus.COMPLETED);

        return toResponse(staffShiftRepository.save(shift));
    }


    private String getCurrentUserEmail() {
        var context = SecurityContextHolder.getContext();
        return Objects.requireNonNull(Objects.requireNonNull(context.getAuthentication()).getName());
    }

    private StaffShiftResponse toResponse(StaffShift shift) {
        return StaffShiftResponse.builder()
                .shiftId(shift.getShiftId())
                .staffId(shift.getStaff().getUserId())
                .staffName(shift.getStaff().getFullName())
                .stationId(shift.getStation().getStationId())
                .stationName(shift.getStation().getName())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .checkInTime(shift.getCheckInTime())
                .checkOutTime(shift.getCheckOutTime())
                .status(shift.getStatus())
                .build();
    }

}
