package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.ChangePasswordRequest;
import com.backend.management_ticket_metro.dto.request.NotificationSettingsRequest;
import com.backend.management_ticket_metro.dto.request.UserUpdateRequest;
import com.backend.management_ticket_metro.dto.response.MyProfileResponse;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.UserMapper;
import com.backend.management_ticket_metro.repository.UserRepository;
import com.backend.management_ticket_metro.validator.PasswordPolicyValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class MyProfileService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;

    public MyProfileResponse getMyProfile() {
        var context = SecurityContextHolder.getContext();
        String email = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toMyProfileResponse(user);
    }

    @Transactional
    public MyProfileResponse updateProfile(UserUpdateRequest request) {
        var context = SecurityContextHolder.getContext();
        String email = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setDob(request.getDob());

        return userMapper.toMyProfileResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        var context = SecurityContextHolder.getContext();
        String email = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.CONFIRM_PASSWORD_NOT_MATCH);
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!passwordPolicyValidator.isValid(request.getNewPassword())) {
            throw new AppException(ErrorCode.PASSWORD_POLICY_VIOLATION);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("User {} changed password successfully", email);
    }

    @Transactional
    public MyProfileResponse updateSettings(NotificationSettingsRequest request) {
        var context = SecurityContextHolder.getContext();
        String email = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getEmailNotification() != null) {
            user.setEmailNotification(request.getEmailNotification());
        }

        if (request.getSmsNotification() != null) {
            user.setSmsNotification(request.getSmsNotification());
        }

        return userMapper.toMyProfileResponse(userRepository.save(user));
    }

    @Transactional
    public MyProfileResponse updateAvatar(String avatarUrl) {
        var context = SecurityContextHolder.getContext();
        String email = Objects.requireNonNull(context.getAuthentication()).getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setAvatarUrl(avatarUrl);
        return userMapper.toMyProfileResponse(userRepository.save(user));
    }
}