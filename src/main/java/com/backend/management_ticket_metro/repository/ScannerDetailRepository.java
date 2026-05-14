package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.ScannerDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScannerDetailRepository extends JpaRepository<ScannerDetail,String> {
    Optional<ScannerDetail> findByDeviceId(String deviceId);
}
