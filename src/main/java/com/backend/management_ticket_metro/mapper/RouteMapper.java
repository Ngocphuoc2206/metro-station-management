package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.response.RouteResponse;
import com.backend.management_ticket_metro.entity.Route;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RouteMapper {
    RouteResponse toRouteResponse(Route route);
}
