package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticationRequest {
    @NotBlank(message = "EMAIL must be not blank")
    @Email(message = "EMAIL_FORMAT_INVALID")
    private String email;

    @NotBlank(message = "Password must be not blank")
    private String password;
}
