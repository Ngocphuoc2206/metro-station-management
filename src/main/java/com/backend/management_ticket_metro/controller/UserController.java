package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.RegisterRequest;
import com.backend.management_ticket_metro.dto.request.UserUpdateRequest;
import com.backend.management_ticket_metro.dto.response.UserResponse;
import com.backend.management_ticket_metro.enums.UserStatus;
import com.backend.management_ticket_metro.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JsonMapper.Builder builder;

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

    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyProfile() {
        return ApiResponse.<UserResponse>builder()
                .results(userService.getMyInfo())
                .build();
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMyProfile(@RequestBody UserUpdateRequest request){
        return ApiResponse.<UserResponse>builder()
                .results(userService.updateProfile(request))
                .build();
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId){
        return ApiResponse.<UserResponse>builder()
                .results(userService.getUserById(userId))
                .build();
    }

    @PatchMapping("/{userId}/status")
    public ApiResponse<UserResponse> updateStatus(@PathVariable String userId, @RequestParam UserStatus status) {
        return ApiResponse.<UserResponse>builder()
                .results(userService.changeStatus(userId, status))
                .build();
    }
}
