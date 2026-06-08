package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.GateScanLog;
import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.enums.GateAction;
import com.backend.management_ticket_metro.enums.ScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.awt.print.Pageable;
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

    @Query("""
            SELECT l FROM GateScanLog l
            JOIN FETCH l.ticket t
            LEFT JOIN FETCH l.station s
            LEFT JOIN FETCH l.gate g
            WHERE t.user = :user
              AND l.result = :result
              AND (:stationId IS NULL OR s.stationId = :stationId)
              AND (:from IS NULL OR l.scannedAt >= :from)
              AND (:to IS NULL OR l.scannedAt <= :to)
            ORDER BY l.scannedAt DESC
            """)
    List<GateScanLog> findMyTripLogs(
            @Param("user") User user,
            @Param("result") ScanResult result,
            @Param("stationId") String stationId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT COUNT(l) FROM GateScanLog l
        WHERE l.ticket.user = :user
          AND l.result = :result
          AND l.action = :action
        """)
    long countCompletedTripsByUser(
            @Param("user") User user,
            @Param("result") ScanResult result,
            @Param("action") GateAction action
    );

    @Query("""
        SELECT l FROM GateScanLog l
        JOIN FETCH l.ticket t
        LEFT JOIN FETCH l.station s
        LEFT JOIN FETCH l.gate g
        WHERE t.user = :user
        ORDER BY l.scannedAt DESC
        """)
    List<GateScanLog> findRecentScanLogsByUser(
            @Param("user") User user,
            Pageable pageable
    );
    // Thêm vào interface GateScanLogRepository
    @Query("""
    SELECT COUNT(l) FROM GateScanLog l
    WHERE l.scannedAt >= :start AND l.scannedAt <= :end
      AND l.result = com.backend.management_ticket_metro.enums.ScanResult.ALLOW
      AND l.action = com.backend.management_ticket_metro.enums.GateAction.TAP_OUT
      AND (:stationId IS NULL OR l.station.stationId = :stationId)
""")
    Long countTripsCompleted(LocalDateTime start, LocalDateTime end, String stationId, String routeId);

    @Query("""
    SELECT FUNCTION('DATE', l.scannedAt),
           SUM(CASE WHEN l.action = 'TAP_OUT' AND l.result = 'ALLOW' THEN 1 ELSE 0 END),
           SUM(CASE WHEN l.action = 'TAP_IN' AND l.result = 'ALLOW' THEN 1 ELSE 0 END),
           SUM(CASE WHEN l.result = 'DENY' THEN 1 ELSE 0 END)
    FROM GateScanLog l
    WHERE l.scannedAt >= :start AND l.scannedAt <= :end
      AND (:stationId IS NULL OR l.station.stationId = :stationId)
    GROUP BY FUNCTION('DATE', l.scannedAt)
""")
    List<Object[]> getTripsReportByDate(LocalDateTime start, LocalDateTime end, String stationId, String routeId);

    @Query("""
    SELECT l.gate.gateId, l.gate.gateCode, l.gate.name, l.station.name,
           COUNT(l),
           SUM(CASE WHEN l.result = 'ALLOW' THEN 1 ELSE 0 END),
           SUM(CASE WHEN l.result = 'DENY' THEN 1 ELSE 0 END)
    FROM GateScanLog l
    WHERE l.scannedAt >= :start AND l.scannedAt <= :end
      AND (:stationId IS NULL OR l.station.stationId = :stationId)
    GROUP BY l.gate.gateId, l.gate.gateCode, l.gate.name, l.station.name
""")
    List<Object[]> getGateActivityReport(LocalDateTime start, LocalDateTime end, String stationId);
}
