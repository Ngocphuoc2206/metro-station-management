package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.GateDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.expression.spel.ast.OpAnd;

import java.util.Optional;

public interface GateDetailRepository extends JpaRepository<GateDetail,String> {
    Optional<GateDetail> findByDevices_DeviceId(String deviceId);
}
