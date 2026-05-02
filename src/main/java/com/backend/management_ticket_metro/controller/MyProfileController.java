package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.ChangePasswordRequest;
import com.backend.management_ticket_metro.dto.request.NotificationSettingsRequest;
import com.backend.management_ticket_metro.dto.request.UserUpdateRequest;
import com.backend.management_ticket_metro.dto.response.MyProfileResponse;
import com.backend.management_ticket_metro.dto.response.UserResponse;
import com.backend.management_ticket_metro.service.MyProfileService;
import com.backend.management_ticket_metro.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class MyProfileController {

    private final MyProfileService myProfileService;

    @GetMapping("/profile")
    public ApiResponse<MyProfileResponse> getMyProfile() {
        return ApiResponse.<MyProfileResponse>builder()
                .results(myProfileService.getMyProfile())
                .build();
    }

    @PutMapping("/profile")
    public ApiResponse<MyProfileResponse> updateProfile(@Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.<MyProfileResponse>builder()
                .results(myProfileService.updateProfile(request))
                .build();
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        myProfileService.changePassword(request);
        return ApiResponse.<Void>builder()
                .message("Đổi mật khẩu thành công")
                .build();
    }

    @PutMapping("/settings")
    public ApiResponse<MyProfileResponse> updateSettings(@RequestBody NotificationSettingsRequest request) {
        return ApiResponse.<MyProfileResponse>builder()
                .results(myProfileService.updateSettings(request))
                .build();
    }

    @PostMapping("/avatar")
    public ApiResponse<MyProfileResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            String physicalPath = "C:\\Users\\Lenovo\\Desktop\\metro-station-management\\Upload\\";
            String fileName = file.getOriginalFilename();

            File destFile = new File(physicalPath + fileName);
            file.transferTo(destFile);

            String databasePath = "/uploads/" + fileName;

            return ApiResponse.<MyProfileResponse>builder()
                    .results(myProfileService.updateAvatar(databasePath))
                    .message("Cập nhật ảnh đại diện thành công")
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file vật lý: " + e.getMessage());
        }
    }
}