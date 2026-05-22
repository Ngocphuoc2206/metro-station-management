package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Devices;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface DevicesRepository extends JpaRepository<Devices,String> {
    boolean existsByDeviceCode(String deviceCode);

    boolean existsByIpAddress(String ipAddress);

    boolean existsByMacAddress(String macAddress);

    Optional<Devices> findByDeviceCode(String deviceCode);
}
