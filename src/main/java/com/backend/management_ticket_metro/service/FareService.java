package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.FareMatrixRequest;
import com.backend.management_ticket_metro.dto.request.TicketTypeRequest;
import com.backend.management_ticket_metro.entity.FareMatrix;
import com.backend.management_ticket_metro.entity.TicketType;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.FareMatrixRepository;
import com.backend.management_ticket_metro.repository.TicketTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FareService {
    @Autowired
    private TicketTypeRepository ticketTypeRepository;

    @Autowired
    private FareMatrixRepository fareMatrixRepository;

    public Double calculateFare(String originId, String destinationId, String ticketTypeName){
        TicketType ticketType = ticketTypeRepository.findByName(ticketTypeName)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));

        // Case 1: daily/monthly -> fixed price
        if (!ticketTypeName.equalsIgnoreCase("single")){
            return ticketType.getPrice();
        }

        // CASE 2: single → calculate fare matrix
        FareMatrix fare = fareMatrixRepository
                .findByOriginStationIdAndDestinationStationId(originId, destinationId)
                .orElseThrow(() -> new AppException(ErrorCode.FARE_INVALID));
        return fare.getPrice();
    }

    public List<TicketType> getTicketTypes() {
        return ticketTypeRepository.findAll();
    }

    public TicketType createTicketType(TicketTypeRequest request) {
        TicketType ticketType = TicketType.builder()
                .name(request.getName().toLowerCase())
                .description(request.getDescription())
                .price(request.getPrice())
                .validityDays(request.getValidityDays())
                .isActive(request.getIsActive())
                .build();

        return ticketTypeRepository.save(ticketType);
    }

    public TicketType updateTicketType(String id, TicketTypeRequest request) {
        TicketType ticketType = ticketTypeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));

        ticketType.setName(request.getName().toLowerCase());
        ticketType.setDescription(request.getDescription());
        ticketType.setPrice(request.getPrice());
        ticketType.setValidityDays(request.getValidityDays());
        ticketType.setIsActive(request.getIsActive());

        return ticketTypeRepository.save(ticketType);
    }

    public FareMatrix createFare(FareMatrixRequest request) {
        FareMatrix fare = FareMatrix.builder()
                .originStationId(request.getOriginStationId())
                .destinationStationId(request.getDestinationStationId())
                .price(request.getPrice())
                .build();

        return fareMatrixRepository.save(fare);
    }

    public FareMatrix updateFare(String id, FareMatrixRequest request) {
        FareMatrix fare = fareMatrixRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new AppException(ErrorCode.FARE_INVALID));

        fare.setOriginStationId(request.getOriginStationId());
        fare.setDestinationStationId(request.getDestinationStationId());
        fare.setPrice(request.getPrice());

        return fareMatrixRepository.save(fare);
    }
}
