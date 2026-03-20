package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.EmailUtils;
import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.constant.PredefinedRole;
import com.backend.management_ticket_metro.dto.request.RegisterRequest;
import com.backend.management_ticket_metro.dto.response.UserResponse;
import com.backend.management_ticket_metro.entity.AuditLog;
import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.entity.UserRole;
import com.backend.management_ticket_metro.enums.UserStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.UserMapper;
import com.backend.management_ticket_metro.repository.AuditLogRepository;
import com.backend.management_ticket_metro.repository.RoleRepository;
import com.backend.management_ticket_metro.repository.UserRepository;
import com.backend.management_ticket_metro.repository.UserRoleRepository;
import com.backend.management_ticket_metro.validator.PasswordPolicyValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    public UserResponse createUser(RegisterRequest request){
        log.info("Password: {}", request.getPassword());
        String normalizedEmail = EmailUtils.normalize(request.getEmail());

        //Map user
        User user = userMapper.toUser(request);

        //Validate
        validateConfirmPassword(request.getPassword(), request.getConfirmPassword());
        validatePasswordPolicy(request.getPassword());
        validateDuplicateEmail(normalizedEmail);

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);

        try{
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception){
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Role rolePassenger = roleRepository.findByRoleName(PredefinedRole.USER_ROLE)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        UserRole userRole = UserRole.builder()
                .user(user)
                .role(rolePassenger)
                .build();
        userRoleRepository.save(userRole);

        AuditLog auditLog = AuditLog.builder()
                .module("AUTH")
                .action("Register")
                .userId(user.getUserId())
                .details("User registered with email: " + user.getEmail())
                .build();
        auditLogRepository.save(auditLog);
        return userMapper.toUserResponse(user);
    }

    public List<UserResponse> getUsers(){
        log.info("Get user ....");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    private void validateConfirmPassword(String password, String confirmPassword) {
        if (password == null || !password.equals(confirmPassword)) {
            throw new AppException(ErrorCode.CONFIRM_PASSWORD_NOT_MATCH);
        }
    }

    private void validatePasswordPolicy(String password) {
        if (!passwordPolicyValidator.isValid(password)) {
            throw new AppException(ErrorCode.PASSWORD_POLICY_VIOLATION);
        }
    }

    private void validateDuplicateEmail(String normalizedEmail) {
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
    }
}
