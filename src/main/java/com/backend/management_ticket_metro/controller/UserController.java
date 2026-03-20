package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.RegisterRequest;
import com.backend.management_ticket_metro.dto.response.UserResponse;
import com.backend.management_ticket_metro.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ApiResponse<UserResponse> registerUser(@Valid @RequestBody RegisterRequest request){
        UserResponse registerResponse = userService.createUser(request);
        return ApiResponse.<UserResponse>builder()
                .results(registerResponse)
                .build();
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> getUsers(){
        return ApiResponse.<List<UserResponse>>builder()
                .results(userService.getUsers())
                .build();
    }
}
