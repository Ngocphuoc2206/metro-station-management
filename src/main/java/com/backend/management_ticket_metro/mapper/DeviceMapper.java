package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.response.DeviceResponse;
import com.backend.management_ticket_metro.entity.Devices;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface DeviceMapper {
    @Mapping(source = "type.typeName", target = "typeName")
    @Mapping(source = "station.name", target = "stationName")
    @Mapping(source = "gate.name", target = "gateName")
    @Mapping(target = "additionalDetails", ignore = true)
    DeviceResponse toDeviceResponse(Devices devices);

}
