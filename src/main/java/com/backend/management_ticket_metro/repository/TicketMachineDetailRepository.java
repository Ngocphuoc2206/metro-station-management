package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.TicketMachineDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TicketMachineDetailRepository extends JpaRepository<TicketMachineDetail,String> {
    Optional<TicketMachineDetail> findByDevices_DeviceId(String deviceId);
}
