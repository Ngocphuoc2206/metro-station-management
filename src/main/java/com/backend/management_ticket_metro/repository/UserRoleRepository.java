package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.UserRole;
import com.backend.management_ticket_metro.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
}
