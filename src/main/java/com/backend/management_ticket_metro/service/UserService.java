package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.constant.PredefinedRole;
import com.backend.management_ticket_metro.dto.request.RegisterRequest;
import com.backend.management_ticket_metro.dto.request.UserUpdateRequest;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;

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
        user.setAddress(request.getAddress());
        user.setDob(request.getDob());
        //Set Status
        user.setStatus(UserStatus.ACTIVE);

        userRepository.save(user);
        log.info("User registered successfully with email={}", user.getEmail());
        return userMapper.toUserResponse(user);
    }
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers(){
        log.info("Get user ....");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name  = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    public UserResponse updateProfile(UserUpdateRequest request ){
        var context = SecurityContextHolder.getContext();
        String email = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setDob(request.getDob());

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUserById(String id){
        return userMapper.toUserResponse(userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse changeStatus(String id, UserStatus status){
        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(status);
        return userMapper.toUserResponse(userRepository.save(user));
    }
}
