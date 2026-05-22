package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Incident;
import com.backend.management_ticket_metro.enums.IncidentPriority;
import com.backend.management_ticket_metro.enums.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {

    @Query("""
        SELECT i FROM Incident i
        WHERE (:status IS NULL OR i.status = :status)
          AND (:priority IS NULL OR i.priority = :priority)
          AND (:stationId IS NULL OR i.station.stationId = :stationId)
        ORDER BY i.createdAt DESC
    """)
    List<Incident> searchIncidents(
            @Param("status") IncidentStatus status,
            @Param("priority") IncidentPriority priority,
            @Param("stationId") String stationId
    );
}