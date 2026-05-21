package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.MetroTrain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MetroTrainRepository extends JpaRepository<MetroTrain, String> {
    List<MetroTrain> findByActiveTrue();

    List<MetroTrain> findByActiveTrueAndRouteId(String routeId);
}
