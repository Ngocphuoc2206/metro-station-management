package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.dto.response.LiveStationStatusResponse;
import com.backend.management_ticket_metro.dto.response.LiveTrainResponse;
import com.backend.management_ticket_metro.entity.MetroStationStatus;
import com.backend.management_ticket_metro.entity.MetroTrain;
import com.backend.management_ticket_metro.repository.MetroStationStatusRepository;
import com.backend.management_ticket_metro.repository.MetroTrainRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveMetroService {
    private final MetroTrainRepository metroTrainRepository;
    private final MetroStationStatusRepository metroStationStatusRepository;

    public List<LiveTrainResponse> getLiveTrains(String routeId){
        log.info("getLiveTrains called: routeId={}", routeId);

        // Get list train
        List<MetroTrain> trains = routeId == null || routeId.isBlank()
                ? metroTrainRepository.findByActiveTrue()
                : metroTrainRepository.findByActiveTrueAndRouteId(routeId);

        return trains.stream()
                .map(this::toLiveTrainResponse)
                .toList();
    }

    public List<LiveStationStatusResponse> getLiveStationStatuses() {
        log.info("getLiveStationStatuses called");

        return metroStationStatusRepository.findByActiveTrue()
                .stream()
                .map(this::toLiveStationStatusResponse)
                .toList();
    }

    private LiveTrainResponse toLiveTrainResponse(MetroTrain train) {
        return LiveTrainResponse.builder()
                .trainId(train.getId())
                .trainCode(train.getTrainCode())
                .routeId(train.getRouteId())
                .currentStationId(train.getCurrentStationId())
                .nextStationId(train.getNextStationId())
                .direction(train.getDirection())
                .status(train.getStatus())
                .delayMinutes(train.getDelayMinutes())
                .lat(train.getLat())
                .lng(train.getLng())
                .updatedAt(train.getUpdatedAt())
                .build();
    }

    private LiveStationStatusResponse toLiveStationStatusResponse(MetroStationStatus stationStatus) {
        return LiveStationStatusResponse.builder()
                .stationId(stationStatus.getStationId())
                .status(stationStatus.getStatus())
                .congestionLevel(stationStatus.getCongestionLevel())
                .message(stationStatus.getMessage())
                .updatedAt(stationStatus.getUpdatedAt())
                .build();
    }
}
