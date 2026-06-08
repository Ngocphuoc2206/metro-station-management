package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Devices;
import com.backend.management_ticket_metro.enums.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
public interface DevicesRepository extends JpaRepository<Devices,String> {
    boolean existsByDeviceCode(String deviceCode);

    boolean existsByIpAddress(String ipAddress);

    boolean existsByMacAddress(String macAddress);

    Optional<Devices> findByDeviceCode(String deviceCode);
    // Thêm vào interface DevicesRepository
    Long countByStatusInAndStation_StationId(List<DeviceStatus> statuses, String stationId);

    @Query("""
    SELECT d.deviceId, d.deviceCode, d.name, d.type.typeName, d.station.name, d.status,
           i.title, i.priority, i.createdAt
    FROM Incident i
    JOIN i.devices d
    WHERE i.status != com.backend.management_ticket_metro.enums.IncidentStatus.CLOSED
      AND (:stationId IS NULL OR d.station.stationId = :stationId)
    ORDER BY i.createdAt DESC
""")
    List<Object[]> getDeviceAlertsWithActiveIncidents(String stationId);
}
