package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    @NotBlank(message = "FullName must not be blank")
    @Size(min = 3, max = 100, message = "USERNAME_INVALID")
    private String fullName;

    @NotBlank(message = "Email must not be blank")
    @Email(message = "EMAIL_FORMAT_INVALID")
    @Size(max = 255, message = "EMAIL_INVALID")
    private String email;

    @NotBlank(message = "Phone must not be blank")
    @Size(min = 8, max = 20, message = "PHONE_INVALID")
    private String phone;

    @NotBlank(message = "Password must not be blank")
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String password;

    @NotBlank(message = "Confirm password must not be blank")
    private String confirmPassword;

    @Size(max = 255, message = "ADDRESS_INVALID")
    private String address;

    private LocalDate dob;
}
