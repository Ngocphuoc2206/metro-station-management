package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.GateScanLog;
import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.enums.ScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GateScanLogRepository extends JpaRepository<GateScanLog, String> {

    Optional<GateScanLog> findTopByTicketAndResultOrderByScannedAtDesc(Ticket ticket, ScanResult result);

    @Query("""
            SELECT l FROM GateScanLog l
            WHERE (:stationId IS NULL OR l.station.stationId = :stationId)
              AND (:gateId IS NULL OR l.gate.gateId = :gateId)
              AND (:from IS NULL OR l.scannedAt >= :from)
              AND (:to IS NULL OR l.scannedAt <= :to)
            ORDER BY l.scannedAt DESC
            """)
    List<GateScanLog> searchLogs(
            String stationId,
            String gateId,
            LocalDateTime from,
            LocalDateTime to
    );
}
