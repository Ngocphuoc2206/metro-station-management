package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Devices;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Devices, String> {
    Optional<Devices> findByDeviceCode(String deviceCode);
}
