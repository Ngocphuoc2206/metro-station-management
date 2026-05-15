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

    STATION_NOT_FOUND(1019, "Station not found"),
    ROUTE_NOT_FOUND(1020, "Route not found"),
    ROUTE_NAME_INVALID_SIZE(1021, "Route name is invalid"),
    STATION_ID_REQUIRE(1022, "Station ID is required and cannot be empty or blank"),
    TRAVEL_TIME_INVALID(1023, "Travel time to the next station must be 0 or greater"),
    DISTANCE_REQUIRED(1024, "Distance to the next station is required and cannot be null"),
    DISTANCE_INVALID(1025, "Distance must be a positive number or zero"),
    STATION_NAME_INVALID_SIZE(1026, "Station name must be between 3 and 100 characters"),
    LATITUDE_INVALID(1027, "Latitude must be a valid coordinate between -90.0 and 90.0 degrees"),
    LONGITUDE_INVALID(1028, "Longitude must be a valid coordinate between -180.0 and 180.0 degrees"),
    TICKET_TYPE_INVALID(1029, "Ticket type not found"),
    FARE_INVALID(1030, "Fare not found"),

    //Order
    ORDER_NOT_FOUND(1031, "Order not found"),
    ORDER_EXPIRED(1032, "Order has expired"),
    ORDER_ALREADY_PAID(1033, "Order has already been paid"),
    INVALID_ORDER_STATUS(1034, "Invalid order status for this action"),
    ORDER_ITEM_EMPTY(1035, "Order must contain at least one item"),

    //File upload
    FILE_UPLOAD_FAILED(1036, "File upload failed"),
    INVALID_FILE(1037, "File is empty or invalid"),
    INVALID_FILE_TYPE(1038, "Only JPG, PNG, WEBP files are allowed"),
    FILE_TOO_LARGE(1039, "File size exceeds the allowed limit"),



    PAYMENT_NOT_FOUND(1040, "Payment not found"),

    //Ticket
    TICKET_NOT_FOUND(1041, "Ticket not found"),
    TICKET_ALREADY_USED(1042, "Ticket already used"),
    TICKET_EXPIRED(1043, "Ticket expired"),
    TICKET_CANCELLED(1044, "Ticket cancelled"),

    //QR
    QR_TOKEN_NOT_FOUND(1045, "QR token not found"),
    QR_TOKEN_EXPIRED(1046, "QR token expired"),
    QR_TOKEN_USED(1047, "QR token already used"),
    QR_TOKEN_INVALID(1048, "QR token invalid"),
    QR_TOKEN_EMPTY(1049, "QR token is empty"),
    QR_TOKEN_REVOKE(1050, "QR token revoked"),

    // Gate
    GATE_NOT_FOUND(1051, "Gate not found"),
    GATE_NOT_ACTIVE(1052, "Gate is not active"),
    UNCATEGORIZED_EXCEPTION  (9999, "UNCATEGORIZED_EXCEPTION!")
    ;
    ErrorCode(int code, String message){
        this.code = code;
        this.message = message;
    }

    private final int code;
    private final String message;

}
