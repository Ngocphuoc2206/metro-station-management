package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.response.RoleResponse;
import com.backend.management_ticket_metro.entity.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    RoleResponse toRoleResponse(Role role);
}
