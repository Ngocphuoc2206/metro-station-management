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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {
    private final DeviceRepository deviceRepository;
    private final GateDetailRepository gateDetailRepository;
    private final TicketMachineDetailRepository ticketMachineDetailRepository;
    private final TopupMachineDetailRepository topupMachineDetailRepository;
    private final ScannerDetailRepository scannerDetailRepository;
    private final DeviceMapper deviceMapper;
    private final StationRepository stationRepository;
    private final DeviceTypeRepository deviceTypeRepository;

    @Transactional(readOnly = true)
    public List<DeviceResponse> getAllDevices() {
        log.info("Getting all devices");
        return deviceRepository.findAll().stream()
                .map(device -> deviceMapper.toDeviceResponse(device, gateDetailRepository, ticketMachineDetailRepository, topupMachineDetailRepository, scannerDetailRepository))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeviceResponse getDeviceById(String id) {
        log.info("Getting device by id {}", id);
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));
        return deviceMapper.toDeviceResponse(device, gateDetailRepository, ticketMachineDetailRepository, topupMachineDetailRepository, scannerDetailRepository);
    }

    @Transactional
    public DeviceResponse createDevice(DeviceRequest request) {

        DeviceType type = deviceTypeRepository.findById(request.getTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_TYPE_INVALID));

        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

        if(deviceRepository.existsByDeviceCode(request.getDeviceCode())){
            throw new AppException(ErrorCode.DEVICE_CODE_EXISTED);
        }
        if(deviceRepository.existsByIpAddress(request.getIpAddress())){
            throw new AppException(ErrorCode.DEVICE_IPADDRESS_EXISTED);
        }
        if(deviceRepository.existsByMacAddress(request.getMacAddress())){
            throw new AppException(ErrorCode.DEVICE_MACADDRESS_EXISTED);
        }
        Device device = Device.builder()
                .deviceCode(request.getDeviceCode())
                .name(request.getName())
                .ipAddress(request.getIpAddress())
                .macAddress(request.getMacAddress())
                .status(request.getStatus())
                .station(station)
                .type(type)
                .build();

        device = deviceRepository.saveAndFlush(device);
        saveDeviceDetails(device, request);

        return deviceMapper.toDeviceResponse(device, gateDetailRepository, ticketMachineDetailRepository, topupMachineDetailRepository, scannerDetailRepository);
    }

    @Transactional
    public DeviceResponse updateDevice(String id, DeviceRequest request) {

        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));
        if(deviceRepository.existsByDeviceCode(request.getDeviceCode())){
            throw new AppException(ErrorCode.DEVICE_CODE_EXISTED);
        }
        if(deviceRepository.existsByIpAddress(request.getIpAddress())){
            throw new AppException(ErrorCode.DEVICE_IPADDRESS_EXISTED);
        }
        if(deviceRepository.existsByMacAddress(request.getMacAddress())){
            throw new AppException(ErrorCode.DEVICE_MACADDRESS_EXISTED);
        }

        device.setName(request.getName());
        device.setIpAddress(request.getIpAddress());
        device.setMacAddress(request.getMacAddress());
        device.setStatus(request.getStatus());

        device = deviceRepository.save(device);
        saveDeviceDetails(device, request);

        return deviceMapper.toDeviceResponse(device, gateDetailRepository, ticketMachineDetailRepository, topupMachineDetailRepository, scannerDetailRepository);
    }

    @Transactional
    public DeviceResponse changeStatus(String id, DeviceStatus status) {

        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));

        device.setStatus(status);
        device = deviceRepository.save(device);

        return deviceMapper.toDeviceResponse(device,
                gateDetailRepository,
                ticketMachineDetailRepository,
                topupMachineDetailRepository,
                scannerDetailRepository);
    }

    private void saveDeviceDetails(Device device, DeviceRequest request) {
        String typeName = device.getType().getTypeName().toUpperCase();
        String deviceId = device.getId();

        switch (typeName) {
            case "GATE" -> {
                GateDetail gate = gateDetailRepository.findById(deviceId).orElse(new GateDetail());


                gate.setDevice(device);

                gate.setDirectionMode(request.getDirectionMode());
                gate.setGateType(request.getGateType());
                gate.setEmergencyMode(request.getEmergencyMode() != null && request.getEmergencyMode());
                gate.setPassageCount(request.getPassageCount() != null ? request.getPassageCount() : 0L);

                gateDetailRepository.save(gate);
            }
            case "TICKET_MACHINE" -> {
                TicketMachineDetail ticket = ticketMachineDetailRepository.findById(deviceId).orElse(new TicketMachineDetail());
                ticket.setDevice(device);
                ticket.setCard_stock_level(request.getCardStockLevel() != null ? request.getCardStockLevel() : 0);
                ticket.setAccepted_payment_methods(request.getAcceptedPaymentMethods());
                ticket.setCash_box_full(request.getCashBoxFull() != null && request.getCashBoxFull() != null);
                ticket.setPrinter_ink_level(request.getPrinterInkLevel() != null ? request.getPrinterInkLevel() : 0);
                ticketMachineDetailRepository.save(ticket);
            }
            case "TOPUP_MACHINE" -> {
                TopupMachineDetail topup = topupMachineDetailRepository.findById(deviceId).orElse(new TopupMachineDetail());
                topup.setDevice(device);
                topup.setReaderFirmwareVersion(request.getReaderFirmwareVersion());
                topup.setMaxTopupLimit(request.getMaxTopupLimit() != null ? request.getMaxTopupLimit() : 0);
                topupMachineDetailRepository.save(topup);
            }
            case "SCANNER" -> {
                ScannerDetail scanner = scannerDetailRepository.findById(deviceId).orElse(new ScannerDetail());
                scanner.setDevice(device);
                scanner.setBattery_level(request.getBatteryLevel() != null ? request.getBatteryLevel() : 0);
                scanner.setOs_version(request.getOsVersion());
                scannerDetailRepository.save(scanner);
            }
        }
    }
}