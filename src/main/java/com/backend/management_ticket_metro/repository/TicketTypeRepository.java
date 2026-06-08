package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TicketTypeRepository extends JpaRepository<TicketType, String> {
    Optional<TicketType> findByNameIgnoreCase(String name);
    Optional<TicketType> findById(String id);
}
