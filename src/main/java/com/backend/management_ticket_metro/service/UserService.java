package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.constant.PredefinedRole;
import com.backend.management_ticket_metro.dto.request.RegisterRequest;
import com.backend.management_ticket_metro.dto.response.UserResponse;
import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.enums.UserStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.UserMapper;
import com.backend.management_ticket_metro.repository.RoleRepository;
import com.backend.management_ticket_metro.repository.UserRepository;
import com.backend.management_ticket_metro.repository.UserRoleRepository;
import com.backend.management_ticket_metro.validator.PasswordPolicyValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.List;

@Service
@Slf4j
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordPolicyValidator passwordPolicyValidator;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationService authenticationService;

    public UserResponse createUser(RegisterRequest request){
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (!request.getPassword().equals(request.getConfirmPassword())){
            throw new AppException(ErrorCode.CONFIRM_PASSWORD_NOT_MATCH);
        }

        Role defaultRole = roleRepository.findByRoleName(PredefinedRole.USER_ROLE)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        log.info("Predefined role: " + PredefinedRole.USER_ROLE);
        //Create mapper
        User user = userMapper.toUser(request);

        //encode password
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        //Set roles for user
        user.setRoles(new HashSet<>());
        user.getRoles().add(defaultRole);

        //Set Status
        user.setStatus(UserStatus.ACTIVE);

        userRepository.save(user);
        log.info("User registered successfully with email={}", user.getEmail());
        return userMapper.toUserResponse(user);
    }

    public List<UserResponse> getUsers(){
        log.info("Get user ....");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }
}
