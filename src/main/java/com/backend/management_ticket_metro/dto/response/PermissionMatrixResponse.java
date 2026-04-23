package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionMatrixResponse {
    private List<PermissionResponse> allPermissions;
    private List<RolePermissionDetail> rolePermissions;

    @Data
    @Builder
    public static class RolePermissionDetail {
        private String roleId;
        private String roleName;
        private Set<String> permissions;
    }
}