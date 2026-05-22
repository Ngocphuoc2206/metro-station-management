package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.constant.PredefinedAccount;
import com.backend.management_ticket_metro.dto.request.IncidentRequest;
import com.backend.management_ticket_metro.dto.response.IncidentCommentResponse;
import com.backend.management_ticket_metro.dto.response.IncidentResponse;
import com.backend.management_ticket_metro.entity.*;
import com.backend.management_ticket_metro.enums.DeviceStatus;
import com.backend.management_ticket_metro.enums.IncidentPriority;
import com.backend.management_ticket_metro.enums.IncidentStatus;
import com.backend.management_ticket_metro.enums.StationStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final IncidentCommentRepository incidentCommentRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final GateRepository gateRepository;
    private final DevicesRepository devicesRepository;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public List<IncidentResponse> getAllIncidents(String statusStr, String priorityStr, String stationId) {
        IncidentStatus status = (statusStr != null && !statusStr.isBlank()) ? IncidentStatus.valueOf(statusStr.toUpperCase()) : null;
        IncidentPriority priority = (priorityStr != null && !priorityStr.isBlank()) ? IncidentPriority.valueOf(priorityStr.toUpperCase()) : null;

        return incidentRepository.searchIncidents(status, priority, stationId).stream()
                .map(this::toIncidentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('STAFF')")
    public IncidentResponse getIncidentById(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));
        return toIncidentResponse(incident);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('STAFF')")
    public IncidentResponse createIncident(IncidentRequest request) {
        User reporter = getCurrentUser();

        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

        Gate gate = (request.getGateId() != null) ? gateRepository.findById(request.getGateId()).orElse(null) : null;
        Devices devices = (request.getDeviceId() != null) ? devicesRepository.findById(request.getDeviceId()).orElse(null) : null;

        // 1. System logic for auto-assigning a single default Staff account
        User defaultStaff = userRepository.findByEmail(PredefinedAccount.STAFF_USER_NAME).orElse(null);

        IncidentStatus initialStatus = (defaultStaff != null) ? IncidentStatus.ASSIGNED : IncidentStatus.OPEN;

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .station(station)
                .gate(gate)
                .devices(devices)
                .priority(request.getPriority())
                .status(initialStatus)
                .reporter(reporter)
                .assignee(defaultStaff) // Auto-assign cho Staff duy nhất
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        incident = incidentRepository.save(incident);

        // 2. Pre-defined timeline for logging system auto-assignment actions
        if (defaultStaff != null) {
            incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(reporter)
                    .content("[Hệ thống] Tự động bàn giao sự cố kỹ thuật này cho Staff trực ga: " + defaultStaff.getFullName())
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // 3. Chained business scenario: Automatic update of broken equipment status
        if (devices != null && (request.getPriority() == IncidentPriority.HIGH || request.getPriority() == IncidentPriority.CRITICAL)) {
            devices.setStatus(DeviceStatus.ERROR);
            devicesRepository.save(devices);

            incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(reporter)
                    .content("[Hệ thống] Phát hiện sự cố nghiêm trọng. Thiết bị mã [" + devices.getDeviceCode() + "] tự động chuyển trạng thái sang: ERROR")
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // 4. Extreme edge case: Critical system crash affecting the entire station
        if (request.getPriority() == IncidentPriority.CRITICAL && request.getTitle().toUpperCase().contains("TOÀN GA")) {
            station.setStatus(StationStatus.MAINTENANCE);
            stationRepository.save(station);

            incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(reporter)
                    .content("[Hệ thống] CẢNH BÁO NGUY HIỂM: Nhà ga [" + station.getName() + "] tự động đóng cửa chuyển sang trạng thái: MAINTENANCE")
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        return toIncidentResponse(incident);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('STAFF')")
    public IncidentResponse updateStatus(String id, String statusStr) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        IncidentStatus newStatus = IncidentStatus.valueOf(statusStr.toUpperCase());
        incident.setStatus(newStatus);
        incident.setUpdatedAt(LocalDateTime.now());

        User currentUser = getCurrentUser();

        // System log for status transitions
        incidentCommentRepository.save(IncidentComment.builder()
                .incident(incident)
                .user(currentUser)
                .content("[Hệ thống] Trạng thái sự cố cập nhật sang: " + newStatus.name())
                .createdAt(LocalDateTime.now())
                .build());

        // Business scenario: When technical incident is RESOLVED or CLOSED
        if (newStatus == IncidentStatus.RESOLVED || newStatus == IncidentStatus.CLOSED) {

            // 1. Restore equipment to normal operating status
            if (incident.getDevices() != null) {
                Devices devices = incident.getDevices();
                devices.setStatus(DeviceStatus.ACTIVE);
                devicesRepository.save(devices);

                incidentCommentRepository.save(IncidentComment.builder()
                        .incident(incident)
                        .user(currentUser)
                        .content("[Hệ thống] Kỹ thuật viên báo cáo sửa xong thiết bị [" + devices.getDeviceCode() + "]. Tự động mở lại: ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .build());
            }

            // 2. Restore station to normal passenger handling status (if previously under full station outage)
            if (incident.getStation().getStatus() == StationStatus.MAINTENANCE) {
                Station station = incident.getStation();
                station.setStatus(StationStatus.ACTIVE);
                stationRepository.save(station);

                incidentCommentRepository.save(IncidentComment.builder()
                        .incident(incident)
                        .user(currentUser)
                        .content("[Hệ thống] Hệ thống nhà ga [" + station.getName() + "] đã khắc phục xong sự cố. Tự động mở cửa đón khách: ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        return toIncidentResponse(incidentRepository.save(incident));
    }
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public IncidentResponse assignStaff(String id, String staffId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        incident.setAssignee(staff);
        incident.setStatus(IncidentStatus.ASSIGNED);
        incident.setUpdatedAt(LocalDateTime.now());

        IncidentComment systemComment = IncidentComment.builder()
                .incident(incident)
                .user(getCurrentUser())
                .content("[Hệ thống] Đã giao sự cố này cho nhân viên: " + staff.getFullName())
                .createdAt(LocalDateTime.now())
                .build();
        incidentCommentRepository.save(systemComment);

        return toIncidentResponse(incidentRepository.save(incident));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('STAFF')")
    public IncidentCommentResponse addComment(String id, String content) {
        if (content == null || content.isBlank()) {
            throw new AppException(ErrorCode.COMMENT_EMPTY);
        }

        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        IncidentComment comment = IncidentComment.builder()
                .incident(incident)
                .user(getCurrentUser())
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        comment = incidentCommentRepository.save(comment);
        return IncidentCommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getUserId())
                .userName(comment.getUser().getFullName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private User getCurrentUser() {
        String email = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private IncidentResponse toIncidentResponse(Incident incident) {
        List<IncidentCommentResponse> commentDTOs = (incident.getComments() != null) ? incident.getComments().stream()
                .map(c -> IncidentCommentResponse.builder()
                        .id(c.getId())
                        .userId(c.getUser().getUserId())
                        .userName(c.getUser().getFullName())
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList() : new ArrayList<>();

        return IncidentResponse.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .stationId(incident.getStation().getStationId())
                .stationName(incident.getStation().getName())
                .gateId(incident.getGate() != null ? incident.getGate().getGateId() : null)
                .gateCode(incident.getGate() != null ? incident.getGate().getGateCode() : null)
                .deviceId(incident.getDevices() != null ? incident.getDevices().getDeviceId() : null)
                .deviceCode(incident.getDevices() != null ? incident.getDevices().getDeviceCode() : null)
                .priority(incident.getPriority().name())
                .status(incident.getStatus().name())
                .reporterName(incident.getReporter().getFullName())
                .assigneeName(incident.getAssignee() != null ? incident.getAssignee().getFullName() : "Chưa bàn giao")
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .comments(commentDTOs)
                .build();
    }
}