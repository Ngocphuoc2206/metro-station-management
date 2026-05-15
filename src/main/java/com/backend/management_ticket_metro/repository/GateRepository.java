package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Gate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GateRepository extends JpaRepository<Gate, String> {
    List<Gate> findByStationStationId(String stationId);
}
