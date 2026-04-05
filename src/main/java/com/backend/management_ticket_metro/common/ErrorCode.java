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
    EMAIL_NOT_EXISTED(1012, "Email is not existed"),
    PHONE_INVALID(1013, "Phone length must be between 8 and 20 characters"),
    PASSWORD_INVALID(1014, "Password must be at least 8 characters"),
    PASSWORD_POLICY_VIOLATION(1015, "Password does not meet security requirements"),
    ROLE_NOT_FOUND(1016, "Default role not found"),
    VALIDATION_ERROR(1017, "Invalid request body"),
    CONFIRM_PASSWORD_NOT_MATCH(1018, "Confirm password does not match"),

    STATION_NOT_FOUND(2001, "Station not found"),

    ROUTE_NOT_FOUND(3001, "Route not found"),

    ;
    ErrorCode(int code, String message){
        this.code = code;
        this.message = message;
    }

    private final int code;
    private final String message;

}
