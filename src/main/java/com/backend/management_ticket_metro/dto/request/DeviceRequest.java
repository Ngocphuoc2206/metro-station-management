package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.DeviceStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRequest {
    // --- Thông tin bảng chính (Device) ---
    private String deviceCode;
    private String name;
    private String ipAddress;
    private String macAddress;
    private String stationId;
    private String gateId;
    private String typeId;
    private DeviceStatus status;
    private LocalDateTime lastMaintenance;

    // --- Thông tin GateDetail ---
    private String directionMode;
    private String gateType;
    private Boolean emergencyMode;
    private Long passageCount;

    // --- Thông tin TicketMachineDetail ---
    private Integer cardStockLevel;
    private String acceptedPaymentMethods;
    private Boolean cashBoxFull;
    private Integer printerInkLevel;

    // --- Thông tin TopupMachineDetail ---
    private String readerFirmwareVersion;
    private Double maxTopupLimit;

    // --- Thông tin ScannerDetail ---
    private Integer batteryLevel;
    private String osVersion;
    private String assignedStaffId;
}