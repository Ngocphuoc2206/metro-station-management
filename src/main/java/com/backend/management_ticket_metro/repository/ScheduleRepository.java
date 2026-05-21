package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Schedule;
import com.backend.management_ticket_metro.enums.ScheduleDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, String> {

    @Query("""
        SELECT s FROM Schedule s
        WHERE (:routeId IS NULL OR s.route.routeId = :routeId)
          AND (:stationId IS NULL OR s.station.stationId = :stationId)
          AND (:direction IS NULL OR s.direction = :direction)
        ORDER BY s.departureTime ASC
    """)
    List<Schedule> searchSchedules(
            @Param("routeId") String routeId,
            @Param("stationId") String stationId,
            @Param("direction") ScheduleDirection direction
    );

    List<Schedule> findByRouteRouteIdOrderByDepartureTimeAsc(String routeId);
}