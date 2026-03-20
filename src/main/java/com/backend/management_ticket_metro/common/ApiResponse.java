package com.backend.management_ticket_metro.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code = ErrorCode.SUCCESS.getCode();
    private String message;
    private T results;

    public static <T> ApiResponse<T> success(T results){
        return ApiResponse.<T>builder()
                .results(results)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T results){
        return ApiResponse.<T>builder()
                .message(message)
                .results(results)
                .build();
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .build();
    }
}
