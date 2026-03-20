package com.backend.management_ticket_metro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private String status;
    private Set<RoleResponse> roles;
    private LocalDate createdAt;
}
