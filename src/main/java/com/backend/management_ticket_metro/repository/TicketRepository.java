package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, String> {
    boolean existsByTicketCode(String ticketCode);

    boolean existsByOrder(Order order);

    List<Ticket> findByOrder(Order order);

    List<Ticket> findByUserOrderByIssuedAtDesc(User user);

    Optional<Ticket> findByIdAndUser(String id, User user);
}
