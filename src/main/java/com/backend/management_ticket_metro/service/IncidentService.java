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

        // Khởi tạo sự cố luôn ở trạng thái OPEN, chưa có người xử lý (assignee = null)
        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .station(station)
                .gate(gate)
                .devices(devices)
                .priority(request.getPriority())
                .status(IncidentStatus.OPEN)
                .reporter(reporter)
                .assignee(null) // Auto-assign cho Staff duy nhất
                .attachmentUrl(request.getAttachmentUrl())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .comments(new ArrayList<>())
                .build();

        incident = incidentRepository.save(incident);
        // Kích hoạt ma trận tự động khóa thiết bị/nhà ga dựa trên độ nghiêm trọng
        if(devices != null && (request.getPriority() == IncidentPriority.HIGH || request.getPriority() == IncidentPriority.CRITICAL)) {
            devices.setStatus(DeviceStatus.ERROR);
            devicesRepository.save(devices);

            IncidentComment sysComment = incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(reporter)
                    .content("[Hệ thống] Phát hiện mức độ nghiêm trọng. Thiết bị mã [" + devices.getDeviceCode() + "] tự động chuyển trạng thái sang: ERROR")
                    .createdAt(LocalDateTime.now())
                    .build());
            incident.getComments().add(sysComment);
        }

        if (request.getPriority() == IncidentPriority.CRITICAL && request.getTitle().toUpperCase().contains("TOÀN GA")) {
            station.setStatus(StationStatus.MAINTENANCE);
            stationRepository.save(station);

            IncidentComment sysComment = incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(reporter)
                    .content("[Hệ thống] CẢNH BÁO NGUY HIỂM: Nhà ga [" + station.getName() + "] tự động chuyển trạng thái sang: MAINTENANCE")
                    .createdAt(LocalDateTime.now())
                    .build());
            incident.getComments().add(sysComment);
        }

        return toIncidentResponse(incident);
    }


    /**
     * BƯỚC 2: ADMIN DUYỆT SỰ CỐ -> CHUYỂN SANG APPROVED & TỰ ĐỘNG GÁN CHO CHÍNH STAFF TẠO PHIẾU
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public IncidentResponse approveIncident(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        if (incident.getStatus() != IncidentStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_INCIDENT_STATUS);
        }

        User admin = getCurrentUser();

        // Luồng cốt lõi: Gán chính tài khoản Staff báo cáo ban đầu chịu trách nhiệm đi sửa tại chỗ
        incident.setAssignee(incident.getReporter());
        incident.setStatus(IncidentStatus.APPROVED);
        incident.setUpdatedAt(LocalDateTime.now());

        IncidentComment sysComment = incidentCommentRepository.save(IncidentComment.builder()
                .incident(incident)
                .user(admin)
                .content("[Hệ thống] Admin đã phê duyệt sự cố. Lệnh sửa chữa được giao lại cho nhân viên trực ga: " + incident.getReporter().getFullName())
                .createdAt(LocalDateTime.now())
                .build());
        if (incident.getComments() == null) incident.setComments(new ArrayList<>());
        incident.getComments().add(sysComment); // Cập nhật bộ nhớ tạm

        return toIncidentResponse(incidentRepository.save(incident));
    }

    /**
     * BƯỚC 3: STAFF BẤM "BẮT ĐẦU SỬA" -> CHUYỂN SANG IN_PROGRESS
     */
    @Transactional
    @PreAuthorize("hasRole('STAFF')")
    public IncidentResponse startProcessing(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        // Chỉ cho phép chuyển sang IN_PROGRESS từ trạng thái APPROVED (hoặc được giao việc)
        if (incident.getStatus() != IncidentStatus.APPROVED) {
            throw new AppException(ErrorCode.INVALID_INCIDENT_STATUS);
        }

        User currentUser = getCurrentUser();
        // Kiểm tra bảo mật: Đúng tài khoản Staff được chỉ định mới được quyền xử lý phiếu này
        if (!incident.getAssignee().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        incident.setStatus(IncidentStatus.IN_PROGRESS);
        incident.setUpdatedAt(LocalDateTime.now());

        IncidentComment sysComment = incidentCommentRepository.save(IncidentComment.builder()
                .incident(incident)
                .user(currentUser)
                .content("[Hệ thống] Nhân viên trực ga đã tiếp nhận hiện trường và bắt đầu tiến hành khắc phục.")
                .createdAt(LocalDateTime.now())
                .build());
        if (incident.getComments() == null) incident.setComments(new ArrayList<>());
        incident.getComments().add(sysComment);

        return toIncidentResponse(incidentRepository.save(incident));
    }

    /**
     * BƯỚC 4: STAFF SỬA XONG -> BẤM "BÁO CÁO HOÀN THÀNH" -> CHUYỂN SANG RESOLVED & TỰ ĐỘNG KHÔI PHỤC THIẾT BỊ
     */
    @Transactional
    @PreAuthorize("hasRole('STAFF')")
    public IncidentResponse resolveIncident(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        if (incident.getStatus() != IncidentStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.INVALID_INCIDENT_STATUS);
        }

        User currentUser = getCurrentUser();
        if (!incident.getAssignee().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setUpdatedAt(LocalDateTime.now());

        if (incident.getComments() == null) incident.setComments(new ArrayList<>());

        IncidentComment resolveComment = incidentCommentRepository.save(IncidentComment.builder()
                .incident(incident)
                .user(currentUser)
                .content("[Hệ thống] Nhân viên báo cáo đã sửa chữa xong thiết bị. Chờ bàn giao Admin kiểm tra nghiệm thu.")
                .createdAt(LocalDateTime.now())
                .build());
        incident.getComments().add(resolveComment);

        // KÍCH HOẠT LUỒNG KHÔI PHỤC TỰ ĐỘNG: Đưa thiết bị/nhà ga quay trở lại phục vụ khách (ACTIVE)
        if (incident.getDevices() != null) {
            Devices devices = incident.getDevices();
            devices.setStatus(DeviceStatus.ACTIVE);
            devicesRepository.save(devices);

            IncidentComment deviceComment = incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(currentUser)
                    .content("[Hệ thống] Sửa chữa hoàn tất thiết bị [" + devices.getDeviceCode() + "]. Tự động mở lại: ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .build());
            incident.getComments().add(deviceComment);
        }

        if (incident.getStation().getStatus() == StationStatus.MAINTENANCE) {
            Station station = incident.getStation();
            station.setStatus(StationStatus.ACTIVE);
            stationRepository.save(station);

            IncidentComment stationComment = incidentCommentRepository.save(IncidentComment.builder()
                    .incident(incident)
                    .user(currentUser)
                    .content("[Hệ thống] Sự cố toàn ga tại [" + station.getName() + "] đã khắc phục. Tự động mở cửa đón khách: ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .build());
            incident.getComments().add(stationComment);
        }

        return toIncidentResponse(incidentRepository.save(incident));
    }

    /**
     * BƯỚC 5A: ADMIN KIỂM TRA THỰC TẾ OK -> BẤM "ĐÓNG SỰ CỐ" (CLOSED - KẾT THÚC)
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public IncidentResponse closeIncident(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        if (incident.getStatus() != IncidentStatus.RESOLVED) {
            throw new AppException(ErrorCode.INVALID_INCIDENT_STATUS);
        }

        User admin = getCurrentUser();
        incident.setStatus(IncidentStatus.CLOSED);
        incident.setUpdatedAt(LocalDateTime.now());

        IncidentComment sysComment = incidentCommentRepository.save(IncidentComment.builder()
                .incident(incident)
                .user(admin)
                .content("[Hệ thống] Admin đã nghiệm thu thực tế đạt yêu cầu. Đóng sự cố thành công.")
                .createdAt(LocalDateTime.now())
                .build());

        if (incident.getComments() == null) incident.setComments(new ArrayList<>());
        incident.getComments().add(sysComment);

        return toIncidentResponse(incidentRepository.save(incident));
    }

    /**
     * BƯỚC 5B: ADMIN KIỂM TRA THẤY VẪN LỖI -> BẤM "TÁI MỞ" (RE-OPEN) -> ĐẨY LÙI VỀ APPROVED
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public IncidentResponse reopenIncident(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_NOT_FOUND));

        if (incident.getStatus() != IncidentStatus.RESOLVED) {
            throw new AppException(ErrorCode.INVALID_INCIDENT_STATUS);
        }

        User admin = getCurrentUser();
        // Đẩy lùi trạng thái về APPROVED để bắt Staff làm lại
        incident.setStatus(IncidentStatus.APPROVED);
        incident.setUpdatedAt(LocalDateTime.now());

        IncidentComment sysComment = incidentCommentRepository.save(IncidentComment.builder()
                .incident(incident)
                .user(admin)
                .content("[Hệ thống] NGHIỆM THU THẤT BẠI: Thiết bị kiểm tra vẫn phát sinh lỗi. Admin yêu cầu tái mở (Re-open) sự cố để xử lý lại.")
                .createdAt(LocalDateTime.now())
                .build());
        if (incident.getComments() == null) incident.setComments(new ArrayList<>());
        incident.getComments().add(sysComment);

        return toIncidentResponse(incidentRepository.save(incident));
    }

    @Transactional
    @PreAuthorize("hasRole('STAFF')")
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
                .assigneeName(incident.getAssignee() != null ? incident.getAssignee().getFullName() : "Chưa phê duyệt")
                .attachmentUrl(incident.getAttachmentUrl())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .comments(commentDTOs)
                .build();
    }
}