package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.PermissionMatrixResponse;
import com.backend.management_ticket_metro.dto.response.PermissionResponse;
import com.backend.management_ticket_metro.entity.Permission;
import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.PermissionRepository;
import com.backend.management_ticket_metro.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    public PermissionMatrixResponse getPermissionMatrix() {
        var allPermissions = permissionRepository.findAll().stream()
                .map(p -> new PermissionResponse(p.getName(), p.getDescription()))
                .toList();

        var rolePermissions = roleRepository.findAll().stream()
                .map(role -> PermissionMatrixResponse.RolePermissionDetail.builder()
                        .roleId(role.getRoleId())
                        .roleName(role.getRoleName())
                        .permissions(role.getPermissions().stream()
                                .map(Permission::getName)
                                .collect(Collectors.toSet()))
                        .build())
                .toList();

        return PermissionMatrixResponse.builder()
                .allPermissions(allPermissions)
                .rolePermissions(rolePermissions)
                .build();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void updateRolePermissions(String roleId, List<String> permissionNames) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        List<Permission> permissions = permissionRepository.findAllById(permissionNames);
        role.setPermissions(new HashSet<>(permissions));
        roleRepository.save(role);
    }
}