package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.request.RegisterRequest;
import com.backend.management_ticket_metro.dto.response.MyProfileResponse;
import com.backend.management_ticket_metro.dto.response.UserResponse;
import com.backend.management_ticket_metro.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(RegisterRequest request);
    UserResponse toUserResponse(User user);
    MyProfileResponse toMyProfileResponse(User user);
}
