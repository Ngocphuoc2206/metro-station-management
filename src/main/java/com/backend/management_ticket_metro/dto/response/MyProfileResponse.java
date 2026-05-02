package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyProfileResponse {
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private LocalDate dob;
    private String avatarUrl;
    private boolean emailNotification;
    private boolean smsNotification;
    private Set<RoleResponse> roles;
}