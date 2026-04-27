package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.PermissionMatrixResponse;
import com.backend.management_ticket_metro.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {
    private final PermissionService permissionService;

    @GetMapping("/matrix")
    public ApiResponse<PermissionMatrixResponse> getMatrix() {
        return ApiResponse.<PermissionMatrixResponse>builder()
                .results(permissionService.getPermissionMatrix())
                .build();
    }

    @PutMapping("/roles/{roleId}")
    public ApiResponse<Void> updateRolePermissions(
            @PathVariable String roleId,
            @RequestBody List<String> permissions) {
        permissionService.updateRolePermissions(roleId, permissions);
        return ApiResponse.<Void>builder()
                .message("Updated permissions for role " + roleId)
                .build();
    }
}