package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.IncidentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentCommentRepository extends JpaRepository<IncidentComment, String> {
}