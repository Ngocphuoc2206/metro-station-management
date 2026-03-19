package com.backend.management_ticket_metro.common;

import lombok.Getter;

@Getter
public enum ErrorCode {
    SUCCESS(1000, "Success"),
    INVALID_REQUEST (1001, "INVALID_REQUEST"),
    UNAUTHENTICATED (1002, "UNAUTHENTICATED"),
    UNAUTHORIZED (1003, "UNAUTHORIZED"),
    USER_NOT_FOUND(1004, "USER_NOT_FOUND"),
    USER_EXISTED(1005, "User existed"),
    INVALID_CREDENTIALS(1006, "Invalid credentials"),
    UNCATEGORIZED_EXCEPTION  (9999, "UNCATEGORIZED_EXCEPTION!")
    ;
    private final int code;
    private final String message;
    ErrorCode(int code, String message){
        this.code = code;
        this.message = message;
    }
}
