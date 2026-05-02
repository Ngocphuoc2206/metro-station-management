package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerUpdateRequest {
    @NotBlank(message = "USERNAME_INVALID")
    @Size(min = 3, max = 100, message = "USERNAME_INVALID")
    private String fullName;

    @NotBlank(message = "EMAIL_FORMAT_INVALID")
    @Email(message = "EMAIL_FORMAT_INVALID")
    @Size(max = 255, message = "EMAIL_INVALID")
    private String email;

    @NotBlank(message = "Phone must not be blank")
    @Size(min = 8, max = 20, message = "PHONE_INVALID")
    private String phone;

    @NotBlank(message = "Address must not be blank")
    @Size(max = 255, message = "ADDRESS_INVALID")
    private String address;

    @NotNull(message = "Date of birth must not be null")
    private LocalDate dob;
}
