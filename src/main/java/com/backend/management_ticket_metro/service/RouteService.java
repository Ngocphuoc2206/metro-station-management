package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.RouteRequest;
import com.backend.management_ticket_metro.dto.request.RouteStationRequest;
import com.backend.management_ticket_metro.dto.response.RouteDetailResponse;
import com.backend.management_ticket_metro.dto.response.RouteResponse;
import com.backend.management_ticket_metro.dto.response.StationInRouteResponse;
import com.backend.management_ticket_metro.entity.Route;
import com.backend.management_ticket_metro.entity.RouteStation;
import com.backend.management_ticket_metro.entity.Station;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.RouteMapper;
import com.backend.management_ticket_metro.repository.RouteRepository;
import com.backend.management_ticket_metro.repository.RouteStationRepository;
import com.backend.management_ticket_metro.repository.StationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class RouteService {
    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private RouteStationRepository routeStationRepository;

    @Autowired
    private RouteMapper routeMapper;

    public List<RouteResponse> getAllRoutes() {
        return routeRepository.findAll().stream()
                .map(routeMapper::toRouteResponse).toList();
    }

    public RouteDetailResponse getRouteById(String id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROUTE_NOT_FOUND));

        List<RouteStation> routeStations = routeStationRepository.findByRouteOrderByStationOrderAsc(route);

        List<StationInRouteResponse> stations = routeStations.stream()
                .map(rs -> StationInRouteResponse.builder()
                        .stationId(rs.getStation().getStationId())
                        .name(rs.getStation().getName())
                        .order(rs.getStationOrder())
                        .travelTimeNext(rs.getTravelTimeNext())
                        .build()).toList();

        return RouteDetailResponse.builder()
                .routeId(route.getRouteId())
                .routeName(route.getRouteName())
                .routeCode(route.getRouteCode())
                .color(route.getColor())
                .stations(stations)
                .build();
    }

    public void deleteRouteById(String id){
        Route route = routeRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ROUTE_NOT_FOUND));
        routeRepository.delete(route);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public RouteResponse createRoute(RouteRequest request) {
        Route route = Route.builder()
                .routeName(request.getRouteName())
                .routeCode(request.getRouteCode())
                .color(request.getColor())
                .status(request.getStatus())
                .build();

        route = routeRepository.save(route);
        saveRouteStations(route, request.getStations());
        return routeMapper.toRouteResponse(route);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public RouteResponse updateRoute(String id, RouteRequest request) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROUTE_NOT_FOUND));

        route.setRouteName(request.getRouteName());
        route.setRouteCode(request.getRouteCode());
        route.setColor(request.getColor());
        route.setStatus(request.getStatus());


        routeStationRepository.deleteByRoute(route);
        saveRouteStations(route, request.getStations());

        return routeMapper.toRouteResponse(routeRepository.save(route));
    }

    private void saveRouteStations(Route route, List<RouteStationRequest> requests) {
        if (requests == null) return;
        for (int i = 0; i < requests.size(); i++) {
            RouteStationRequest req = requests.get(i);
            Station station = stationRepository.findById(req.getStationId())
                    .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

            RouteStation rs = RouteStation.builder()
                    .route(route)
                    .station(station)
                    .stationOrder(i + 1)
                    .travelTimeNext(req.getTravelTimeNext())
                    .distanceNext(req.getDistanceNext())
                    .build();
            routeStationRepository.save(rs);
        }
    }
}