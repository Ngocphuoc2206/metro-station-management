package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.DeviceStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceStatusLogRepository extends JpaRepository<DeviceStatusLog,String> {

}
