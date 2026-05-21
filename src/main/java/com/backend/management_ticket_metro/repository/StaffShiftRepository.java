package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.StaffShift;
import com.backend.management_ticket_metro.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, String> {
    Optional<StaffShift> findFirstByStaff_EmailAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByStartTimeDesc(
            String email,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    List<StaffShift> findByStaff_EmailAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
            String email,
            LocalDateTime from,
            LocalDateTime to
    );

    Optional<StaffShift> findFirstByStaff_EmailAndStatusOrderByStartTimeDesc(
            String staff_email, ShiftStatus status
    );
}
