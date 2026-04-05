package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRepository extends JpaRepository<Route, String> {
}
