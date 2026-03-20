package com.backend.management_ticket_metro.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    SUCCESS(1000, "Success"),
    INVALID_REQUEST (1001, "INVALID_REQUEST"),
    UNAUTHENTICATED (1002, "UNAUTHENTICATED"),
    UNAUTHORIZED (1003, "UNAUTHORIZED"),
    USER_NOT_FOUND(1004, "USER_NOT_FOUND"),
    USER_EXISTED(1005, "User existed"),
    USERNAME_INVALID(1006, "UserName must be at least 3 characters and max 100 characters"),
    INVALID_PASSWORD(1007, "Password must be at least 8 CHARACTERS"),
    INVALID_CREDENTIALS(1008, "Invalid credentials"),
    EMAIL_FORMAT_INVALID(1009, "Email format is invalid"),
    EMAIL_INVALID(1010, "Email must not exceed 255 characters"),
    EMAIL_ALREADY_EXISTS(1011, "Email already exists"),
    PHONE_INVALID(1012, "Phone length must be between 8 and 20 characters"),
    PASSWORD_INVALID(1013, "Password must be at least 8 characters"),
    PASSWORD_POLICY_VIOLATION(1014, "Password does not meet security requirements"),
    ROLE_NOT_FOUND(1015, "Default role not found"),
    VALIDATION_ERROR(1016, "Invalid request body"),


    CONFIRM_PASSWORD_NOT_MATCH(1014, "Confirm password does not match"),

    UNCATEGORIZED_EXCEPTION  (9999, "UNCATEGORIZED_EXCEPTION!")
    ;
    ErrorCode(int code, String message){
        this.code = code;
        this.message = message;
    }

    private final int code;
    private final String message;

}
