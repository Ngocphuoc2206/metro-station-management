package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.FareMatrixRequest;
import com.backend.management_ticket_metro.dto.request.TicketTypeRequest;
import com.backend.management_ticket_metro.entity.FareMatrix;
import com.backend.management_ticket_metro.entity.TicketType;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.FareMatrixRepository;
import com.backend.management_ticket_metro.repository.TicketTypeRepository;
import com.backend.management_ticket_metro.util.TicketTypeNameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FareService {
    @Autowired
    private TicketTypeRepository ticketTypeRepository;

    @Autowired
    private FareMatrixRepository fareMatrixRepository;

    private static final double SINGLE_PRICE_PER_KM = 1000.0;
    private static final double SINGLE_MAX_FARE = 20000.0;

    public Double calculateFare(String originId, String destinationId, String ticketTypeName, Double distance){
        String normalizedTicketTypeName = normalizeTicketTypeName(ticketTypeName);

        TicketType ticketType = findTicketTypeByNameOrAlias(normalizedTicketTypeName);

        double ticketPrice = ticketType.getPrice();
        // Case 1: Monthly / Daily -> lấy giá cố định trong bảng ticket_type
        if (TicketTypeNameUtils.isFixedPriceTicket(ticketType.getName())) {
            return ticketPrice;
        }

        // CASE 2: SINGLE → calculate fare matrix
        validateSingleFareInput(originId, destinationId, distance);

        double rawPrice = 0;
        // distance <= 5km
        if (distance <= 5){
            rawPrice = ticketPrice;
        } else {
            rawPrice = ticketPrice + (distance - 5) * SINGLE_PRICE_PER_KM;
        }
        double roundedPrice = roundUpToNearestThousand(rawPrice);

        return Math.min(roundedPrice, SINGLE_MAX_FARE);
    }

    public List<TicketType> getTicketTypes() {
        return ticketTypeRepository.findAll();
    }

    public TicketType createTicketType(TicketTypeRequest request) {
        TicketType ticketType = TicketType.builder()
                .name(normalizeTicketTypeName(request.getName()))
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

        ticketType.setName(normalizeTicketTypeName(request.getName()));
        ticketType.setDescription(request.getDescription());
        ticketType.setPrice(request.getPrice());
        ticketType.setValidityDays(request.getValidityDays());
        ticketType.setIsActive(request.getIsActive());

        return ticketTypeRepository.save(ticketType);
    }

    public void deleteTicketType(String id){
        TicketType ticketType = ticketTypeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));

        ticketTypeRepository.delete(ticketType);
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

    private String normalizeTicketTypeName(String ticketName){
        if (ticketName == null || ticketName.isBlank()){
            throw new AppException(ErrorCode.TICKET_TYPE_INVALID);
        }

        return TicketTypeNameUtils.normalize(ticketName);
    }

    private TicketType findTicketTypeByNameOrAlias(String ticketTypeName) {
        return ticketTypeRepository.findAll()
                .stream()
                .filter(ticketType -> TicketTypeNameUtils.normalize(ticketType.getName())
                        .equalsIgnoreCase(ticketTypeName))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));
    }

    private void validateSingleFareInput(String originId, String destinationId, Double distance) {
        if (originId == null || originId.isBlank()
                || destinationId == null || destinationId.isBlank()
                || originId.equals(destinationId)
                || distance == null || distance <= 0) {
            throw new AppException(ErrorCode.FARE_INVALID);
        }
    }

    private double roundUpToNearestThousand(double price) {
        return Math.ceil(price / 1000.0) * 1000.0;
    }
}
