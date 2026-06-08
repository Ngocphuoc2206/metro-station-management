package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order,String> {
    List<Order> findByUser(User user);
    List<Order> findByStatus(OrderStatus status);

    // --- Dashboard ---
    //Find the User's first (most recent) order.
    List<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    // Find orders for a specific user created after 'dateTime'
    List<Order> findByUserAndCreatedAtAfter(User user, LocalDateTime dateTime);

    Collection<Order> findByUserAndStatusAndCreatedAtAfter(User user, OrderStatus status, LocalDateTime createdAtAfter);
    // Thêm vào interface OrderRepository
    @Query("""
    SELECT SUM(o.totalAmount) FROM Order o 
    LEFT JOIN o.orderItems oi
    WHERE o.status = com.backend.management_ticket_metro.enums.OrderStatus.PAID
      AND o.createdAt >= :start AND o.createdAt <= :end
      AND (:stationId IS NULL OR oi.fromStation.stationId = :stationId OR oi.toStation.stationId = :stationId)
      AND (:routeId IS NULL OR oi.ticketType.Id IN (
            SELECT tt.Id FROM TicketType tt WHERE tt.Id = oi.ticketType.Id
          )) 
""")
    Double calculateTotalRevenue(LocalDateTime start, LocalDateTime end, String stationId, String routeId);

    @Query("""
    SELECT FUNCTION('DATE', o.createdAt) as d, SUM(o.totalAmount), COUNT(o) 
    FROM Order o 
    LEFT JOIN o.orderItems oi
    WHERE o.status = com.backend.management_ticket_metro.enums.OrderStatus.PAID
      AND o.createdAt >= :start AND o.createdAt <= :end
      AND (:stationId IS NULL OR oi.fromStation.stationId = :stationId OR oi.toStation.stationId = :stationId)
    GROUP BY FUNCTION('DATE', o.createdAt)
""")
    List<Object[]> getRevenueReportByDate(LocalDateTime start, LocalDateTime end, String stationId, String routeId);
}
