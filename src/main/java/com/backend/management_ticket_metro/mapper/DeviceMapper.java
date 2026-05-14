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
    DeviceResponse toDeviceResponse(Device device);

}
