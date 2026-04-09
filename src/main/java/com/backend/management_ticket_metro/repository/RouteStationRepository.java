package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Route;
import com.backend.management_ticket_metro.entity.RouteStation;
import com.backend.management_ticket_metro.entity.RouteStationId;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface RouteStationRepository extends JpaRepository<RouteStation, RouteStationId> {
    List<RouteStation> findByRouteOrderByStationOrderAsc(Route route);

    @Transactional
    @Modifying
    void deleteByRoute(Route route);
}
