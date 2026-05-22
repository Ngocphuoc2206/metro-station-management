package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.DeviceRequest;
import com.backend.management_ticket_metro.dto.response.DeviceResponse;
import com.backend.management_ticket_metro.entity.*;
import com.backend.management_ticket_metro.enums.DeviceStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.DeviceMapper;
import com.backend.management_ticket_metro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {
    private final DevicesRepository devicesRepository;
    private final GateDetailRepository gateDetailRepository;
    private final TicketMachineDetailRepository ticketMachineDetailRepository;
    private final ScannerDetailRepository scannerDetailRepository;
    private final DeviceMapper deviceMapper;
    private final StationRepository stationRepository;
    private final DeviceTypeRepository deviceTypeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DeviceResponse> getAllDevices() {
        log.info("Getting all devices");
        return devicesRepository.findAll().stream()
                .map(this::toDeviceResponseWithDetails)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeviceResponse getDeviceById(String id) {
        log.info("Getting device by id {}", id);
        Devices devices = devicesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));
        return toDeviceResponseWithDetails(devices);
    }

    @Transactional
    public DeviceResponse createDevice(DeviceRequest request) {
        DeviceType type = deviceTypeRepository.findById(request.getTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_TYPE_INVALID));

        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

        if (devicesRepository.existsByDeviceCode(request.getDeviceCode())) {
            throw new AppException(ErrorCode.DEVICE_CODE_EXISTED);
        }
        if (devicesRepository.existsByIpAddress(request.getIpAddress())) {
            throw new AppException(ErrorCode.DEVICE_IPADDRESS_EXISTED);
        }
        if (devicesRepository.existsByMacAddress(request.getMacAddress())) {
            throw new AppException(ErrorCode.DEVICE_MACADDRESS_EXISTED);
        }

        Devices devices = Devices.builder()
                .deviceCode(request.getDeviceCode())
                .name(request.getName())
                .ipAddress(request.getIpAddress())
                .macAddress(request.getMacAddress())
                .status(request.getStatus())
                .station(station)
                .type(type)
                .build();

        devices = devicesRepository.save(devices);
        saveDeviceDetails(devices, request);

        return toDeviceResponseWithDetails(devices);
    }

    @Transactional
    public DeviceResponse updateDevice(String id, DeviceRequest request) {
        Devices devices = devicesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));


        if (!devices.getDeviceCode().equals(request.getDeviceCode()) && devicesRepository.existsByDeviceCode(request.getDeviceCode())) {
            throw new AppException(ErrorCode.DEVICE_CODE_EXISTED);
        }
        if (!devices.getIpAddress().equals(request.getIpAddress()) && devicesRepository.existsByIpAddress(request.getIpAddress())) {
            throw new AppException(ErrorCode.DEVICE_IPADDRESS_EXISTED);
        }
        if (!devices.getMacAddress().equals(request.getMacAddress()) && devicesRepository.existsByMacAddress(request.getMacAddress())) {
            throw new AppException(ErrorCode.DEVICE_MACADDRESS_EXISTED);
        }

        devices.setName(request.getName());
        devices.setIpAddress(request.getIpAddress());
        devices.setMacAddress(request.getMacAddress());
        devices.setStatus(request.getStatus());

        devices = devicesRepository.save(devices);
        saveDeviceDetails(devices, request);

        return toDeviceResponseWithDetails(devices);
    }

    @Transactional
    public DeviceResponse changeStatus(String id, DeviceStatus status) {
        Devices devices = devicesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));

        devices.setStatus(status);
        devices = devicesRepository.save(devices);

        return toDeviceResponseWithDetails(devices);
    }

    private void saveDeviceDetails(Devices devices, DeviceRequest request) {
        String typeName = devices.getType().getTypeName().toUpperCase();
        String deviceId = devices.getDeviceId();

        switch (typeName) {
            case "GATE" -> {
                GateDetail gate = gateDetailRepository.findByDevices_DeviceId(deviceId)
                        .orElseGet(() -> GateDetail.builder()
                                .devices(devices)
                                .build());
                gate.setDirection_mode(request.getDirectionMode());
                gate.setGate_type(request.getGateType());
                gate.setEmergency_mode(request.getEmergencyMode() != null && request.getEmergencyMode());
                gate.setPassage_count(request.getPassageCount() != null ? request.getPassageCount() : 0L);

                gateDetailRepository.save(gate);
            }
            case "TICKET_MACHINE" -> {
                TicketMachineDetail ticket = ticketMachineDetailRepository.findByDevices_DeviceId(deviceId)
                        .orElseGet(() -> TicketMachineDetail.builder()
                                .devices(devices)
                                .build());

                ticket.setCard_stock_level(request.getCardStockLevel() != null ? request.getCardStockLevel() : 0);
                ticket.setAccepted_payment_methods(request.getAcceptedPaymentMethods());
                ticket.setCash_box_full(request.getCashBoxFull() != null && request.getCashBoxFull());
                ticket.setPrinter_ink_level(request.getPrinterInkLevel() != null ? request.getPrinterInkLevel() : 0);
                ticketMachineDetailRepository.save(ticket);
            }
            case "SCANNER" -> {

                ScannerDetail scanner = scannerDetailRepository.findByDevices_DeviceId(deviceId)
                        .orElseGet(() -> ScannerDetail.builder()
                                .devices(devices)
                                .build());

                scanner.setBattery_level(request.getBatteryLevel() != null ? request.getBatteryLevel() : 0);
                scanner.setOs_version(request.getOsVersion());
                if (request.getAssignedStaffId() != null) {
                    User staff = userRepository.findById(request.getAssignedStaffId())
                            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                    scanner.setAssignedStaff(staff);
                }
                scannerDetailRepository.save(scanner);
            }
        }
    }

    private DeviceResponse toDeviceResponseWithDetails(Devices devices) {
        DeviceResponse response = deviceMapper.toDeviceResponse(devices);
        Map<String, Object> detailsMap = new HashMap<>();
        String typeName = devices.getType().getTypeName().toUpperCase();
        String deviceId = devices.getDeviceId();

        switch (typeName) {
            case "GATE" -> gateDetailRepository.findByDevices_DeviceId(deviceId).ifPresent(detail -> {
                detailsMap.put("directionMode", detail.getDirection_mode());
                detailsMap.put("gateType", detail.getGate_type());
                detailsMap.put("emergencyMode", detail.isEmergency_mode());
                detailsMap.put("passageCount", detail.getPassage_count());
            });
            case "TICKET_MACHINE" -> ticketMachineDetailRepository.findByDevices_DeviceId(deviceId).ifPresent(detail -> {
                detailsMap.put("cardStockLevel", detail.getCard_stock_level());
                detailsMap.put("acceptedPaymentMethods", detail.getAccepted_payment_methods());
                detailsMap.put("cashBoxFull", detail.isCash_box_full());
                detailsMap.put("printerInkLevel", detail.getPrinter_ink_level());
            });
            case "SCANNER" -> scannerDetailRepository.findByDevices_DeviceId(deviceId).ifPresent(detail -> {
                detailsMap.put("batteryLevel", detail.getBattery_level());
                detailsMap.put("osVersion", detail.getOs_version());
                if (detail.getAssignedStaff() != null) {
                    Map<String, Object> staffMap = new HashMap<>();
                    staffMap.put("id", detail.getAssignedStaff().getUserId());
                    staffMap.put("name", detail.getAssignedStaff().getFullName());
                    detailsMap.put("assignedStaff", staffMap);
                } else {
                    detailsMap.put("assignedStaff", null);
                }
            });
        }

        response.setAdditionalDetails(detailsMap);
        return response;
    }
}