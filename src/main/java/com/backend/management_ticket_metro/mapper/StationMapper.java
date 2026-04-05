package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.request.StationRequest;
import com.backend.management_ticket_metro.dto.response.StationResponse;
import com.backend.management_ticket_metro.entity.Station;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

// StationMapper.java
@Mapper(componentModel = "spring")
public interface StationMapper {

    Station toStation(StationRequest request);
    StationResponse toStationResponse(Station station);
    void updateStation(@MappingTarget Station station, StationRequest request);
}

