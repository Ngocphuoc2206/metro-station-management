package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.StationRequest;
import com.backend.management_ticket_metro.dto.response.StationResponse;
import com.backend.management_ticket_metro.entity.Station;
import com.backend.management_ticket_metro.enums.StationStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.StationMapper;
import com.backend.management_ticket_metro.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class StationService {
    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private StationMapper stationMapper;

    public StationResponse createStation(StationRequest request) {
        Station station = stationMapper.toStation(request);

        if (station.getStatus() == null) station.setStatus(StationStatus.ACTIVE);

        return stationMapper.toStationResponse(stationRepository.save(station));
    }

    public List<StationResponse> getAllStations() {
        return stationRepository.findAll().stream()
                .map(stationMapper::toStationResponse)
                .toList();
    }

    public StationResponse getStationById(String id) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));
        return stationMapper.toStationResponse(station);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public StationResponse updateStation(String id, StationRequest request) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

        station.setName(request.getName());
        station.setAddress(request.getAddress());
        station.setLatitude(request.getLatitude());
        station.setLongitude(request.getLongitude());
        if(request.getStatus() != null)
            station.setStatus(request.getStatus());

        return stationMapper.toStationResponse(stationRepository.save(station));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteStation(String id) {
        if (!stationRepository.existsById(id))
            throw new AppException(ErrorCode.STATION_NOT_FOUND);
        stationRepository.deleteById(id);
    }
}
