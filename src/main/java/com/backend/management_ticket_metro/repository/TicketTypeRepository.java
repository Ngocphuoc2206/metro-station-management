package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.TicketType;
import com.backend.management_ticket_metro.enums.TicketName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface TicketTypeRepository extends JpaRepository<TicketType, String> {
    Optional<TicketType> findByName(TicketName name);
    Optional<TicketType> findById(String id);
}
