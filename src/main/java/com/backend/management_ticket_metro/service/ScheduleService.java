package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.ScheduleRequest;
import com.backend.management_ticket_metro.dto.response.ScheduleResponse;
import com.backend.management_ticket_metro.entity.Route;
import com.backend.management_ticket_metro.entity.Schedule;
import com.backend.management_ticket_metro.entity.Station;
import com.backend.management_ticket_metro.enums.ScheduleDirection;
import com.backend.management_ticket_metro.enums.ScheduleStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.RouteRepository;
import com.backend.management_ticket_metro.repository.ScheduleRepository;
import com.backend.management_ticket_metro.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final RouteRepository routeRepository;
    private final StationRepository stationRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedules(String routeId, String stationId, String directionStr) {
        ScheduleDirection direction = null;
        if (directionStr != null && !directionStr.isBlank()) {
            try {
                direction = ScheduleDirection.valueOf(directionStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException(ErrorCode.DIRECTION_INVALID);
            }
        }

        return scheduleRepository.searchSchedules(routeId, stationId, direction).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByRoute(String routeId) {
        if (!routeRepository.existsById(routeId)) {
            throw new AppException(ErrorCode.ROUTE_NOT_FOUND);
        }
        return scheduleRepository.findByRouteRouteIdOrderByDepartureTimeAsc(routeId).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ScheduleResponse createSchedule(ScheduleRequest request) {
        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new AppException(ErrorCode.ROUTE_NOT_FOUND));
        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

        Schedule schedule = Schedule.builder()
                .route(route)
                .station(station)
                .direction(request.getDirection())
                .departureTime(request.getDepartureTime())
                .arrivalTime(request.getArrivalTime())
                .frequencyMinutes(request.getFrequencyMinutes())
                .status(request.getStatus() != null ? request.getStatus() : ScheduleStatus.ACTIVE)
                .build();

        return toScheduleResponse(scheduleRepository.save(schedule));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ScheduleResponse updateSchedule(String id, ScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));

        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new AppException(ErrorCode.ROUTE_NOT_FOUND));
        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

        schedule.setRoute(route);
        schedule.setStation(station);
        schedule.setDirection(request.getDirection());
        schedule.setDepartureTime(request.getDepartureTime());
        schedule.setArrivalTime(request.getArrivalTime());
        schedule.setFrequencyMinutes(request.getFrequencyMinutes());
        if (request.getStatus() != null) {
            schedule.setStatus(request.getStatus());
        }

        return toScheduleResponse(scheduleRepository.save(schedule));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSchedule(String id) {
        if (!scheduleRepository.existsById(id)) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }
        scheduleRepository.deleteById(id);
    }

    private ScheduleResponse toScheduleResponse(Schedule schedule) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .routeId(schedule.getRoute().getRouteId())
                .stationId(schedule.getStation().getStationId())
                .direction(schedule.getDirection().name())
                .departureTime(schedule.getDepartureTime().format(TIME_FORMATTER))
                .arrivalTime(schedule.getArrivalTime().format(TIME_FORMATTER))
                .frequencyMinutes(schedule.getFrequencyMinutes())
                .status(schedule.getStatus().name())
                .build();
    }
}