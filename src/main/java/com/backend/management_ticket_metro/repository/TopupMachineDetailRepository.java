package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.TopupMachineDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TopupMachineDetailRepository extends JpaRepository<TopupMachineDetail,String> {
    Optional<TopupMachineDetail> findByDeviceId(String deviceId);
}
