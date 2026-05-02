package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {
    @NotBlank(message = "PASSWORD_INVALID")
    private String oldPassword;

    @NotBlank(message = "PASSWORD_INVALID")
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String newPassword;

    @NotBlank(message = "PASSWORD_INVALID")
    private String confirmPassword;
}
