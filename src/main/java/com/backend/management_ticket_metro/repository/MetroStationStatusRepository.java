package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.MetroStationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MetroStationStatusRepository extends JpaRepository<MetroStationStatus, String> {
    List<MetroStationStatus> findByActiveTrue();
}
