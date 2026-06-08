package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.enums.TicketStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, String> {
    boolean existsByTicketCode(String ticketCode);

    boolean existsByOrder(Order order);

    List<Ticket> findByOrder(Order order);

    List<Ticket> findByUser(User user);

    List<Ticket> findByUserOrderByIssuedAtDesc(User user);

    Optional<Ticket> findByIdAndUser(String id, User user);

    // ---Dashboard ---
    // Count tickets that are in the list (READY, ACTIVE) and have not expired.
    long countByUserAndStatusInAndExpiredAtAfter(User user, List<TicketStatus> statuses, LocalDateTime now);
    //Get a list of recent tickets with pagination (to limit the number, for example, Top 3)
    List<Ticket> findByUserOrderByIssuedAtDesc(User user, Pageable pageable);
    // Thêm vào interface TicketRepository
    @Query("""
    SELECT COUNT(t) FROM Ticket t
    WHERE t.issuedAt >= :start AND t.issuedAt <= :end
      AND (:stationId IS NULL OR t.orderItem.fromStation.stationId = :stationId OR t.orderItem.toStation.stationId = :stationId)
""")
    Long countTicketsSold(LocalDateTime start, LocalDateTime end, String stationId, String routeId);

    @Query("""
    SELECT t.orderItem.ticketType.name, COUNT(t) FROM Ticket t
    WHERE t.issuedAt >= :start AND t.issuedAt <= :end
      AND (:stationId IS NULL OR t.orderItem.fromStation.stationId = :stationId OR t.orderItem.toStation.stationId = :stationId)
    GROUP BY t.orderItem.ticketType.name
""")
    List<Object[]> countTicketsGroupedByType(LocalDateTime start, LocalDateTime end, String stationId, String routeId);

    @Query("""
    SELECT FUNCTION('DATE', t.issuedAt), t.orderItem.ticketType.name, COUNT(t), SUM(t.orderItem.unitprice)
    FROM Ticket t
    WHERE t.issuedAt >= :start AND t.issuedAt <= :end
      AND (:stationId IS NULL OR t.orderItem.fromStation.stationId = :stationId OR t.orderItem.toStation.stationId = :stationId)
    GROUP BY FUNCTION('DATE', t.issuedAt), t.orderItem.ticketType.name
""")
    List<Object[]> getTicketSalesReportByDate(LocalDateTime start, LocalDateTime end, String stationId, String routeId);
}
