package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device,String> {
    boolean existsByDeviceCode(String deviceCode);

    boolean existsByIpAddress(String ipAddress);

    boolean existsByMacAddress(String macAddress);
}
