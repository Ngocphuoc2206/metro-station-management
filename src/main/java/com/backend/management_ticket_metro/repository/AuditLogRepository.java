package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
}
