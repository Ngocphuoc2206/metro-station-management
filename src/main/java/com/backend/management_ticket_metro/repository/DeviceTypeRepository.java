package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTypeRepository extends JpaRepository<DeviceType,String> {
}
