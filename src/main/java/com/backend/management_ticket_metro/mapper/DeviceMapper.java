package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.DeviceResponse;
import com.backend.management_ticket_metro.entity.Device;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.GateDetailRepository;
import com.backend.management_ticket_metro.repository.ScannerDetailRepository;
import com.backend.management_ticket_metro.repository.TicketMachineDetailRepository;
import com.backend.management_ticket_metro.repository.TopupMachineDetailRepository;
import org.mapstruct.*;

import java.util.HashMap;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface DeviceMapper {
    @Mapping(source = "type.typeName", target = "typeName")
    @Mapping(source = "station.name", target = "stationName")
    @Mapping(target = "additionalDetails", ignore = true)
    DeviceResponse toDeviceResponse(Device device,
                                    @Context GateDetailRepository gateRepo,
                                    @Context TicketMachineDetailRepository ticketRepo,
                                    @Context TopupMachineDetailRepository topupRepo,
                                    @Context ScannerDetailRepository scannerRepo);

    @AfterMapping
    default void fillDetails(Device device, @MappingTarget DeviceResponse response,
                             @Context GateDetailRepository gateRepo,
                             @Context TicketMachineDetailRepository ticketRepo,
                             @Context TopupMachineDetailRepository topupRepo,
                             @Context ScannerDetailRepository scannerRepo) {

        Map<String, Object> details = new HashMap<>();
        String type = response.getTypeName(); // Get type device (GATE, SCANNER...)
        String id = device.getId();

        if (type == null) throw new AppException(ErrorCode.DEVICE_TYPE_INVALID);

        switch (type.toUpperCase()) {
            case "GATE" -> {
                var d = gateRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.DEVICE_DETAIL_NOT_FOUND));
                details.put("directionMode", d.getDirectionMode());
                details.put("gateType", d.getGateType());
                details.put("emergencyMode", d.isEmergencyMode());
                details.put("passageCount", d.getPassageCount());
            }
            case "TICKET_MACHINE" -> {
                var d  = ticketRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.DEVICE_DETAIL_NOT_FOUND));
                details.put("cardStockLevel", d.getCard_stock_level());
                details.put("acceptedPaymentMethods", d.getAccepted_payment_methods());
                details.put("cashBoxFull", d.isCash_box_full());
                details.put("printerInkLevel", d.getPrinter_ink_level());
            }
            case "TOPUP_MACHINE" -> {
                var d = topupRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.DEVICE_DETAIL_NOT_FOUND));
                details.put("firmwareVersion", d.getReaderFirmwareVersion());
                details.put("maxTopupLimit",d.getMaxTopupLimit());
            }
            case "SCANNER" -> {
                var d = scannerRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.DEVICE_DETAIL_NOT_FOUND));
                details.put("batteryLevel", d.getBattery_level());
                details.put("osVersion", d.getOs_version());

                if(d.getAssignedStaff() != null)
                {
                    details.put("staffName", d.getAssignedStaff().getFullName());
                    details.put("staffEmail", d.getAssignedStaff().getEmail());
                }
            }
        }
        response.setAdditionalDetails(details);
    }
}
