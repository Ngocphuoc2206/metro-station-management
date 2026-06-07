package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.ScanTicketRequest;
import com.backend.management_ticket_metro.dto.request.UpdateGateStatusRequest;
import com.backend.management_ticket_metro.dto.response.GateResponse;
import com.backend.management_ticket_metro.dto.response.GateScanLogResponse;
import com.backend.management_ticket_metro.dto.response.GateScanResponse;
import com.backend.management_ticket_metro.entity.*;
import com.backend.management_ticket_metro.enums.GateAction;
import com.backend.management_ticket_metro.enums.GateStatus;
import com.backend.management_ticket_metro.enums.ScanResult;
import com.backend.management_ticket_metro.enums.TicketName;
import com.backend.management_ticket_metro.enums.TicketStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GateService {

    private final GateRepository gateRepository;
    private final GateScanLogRepository gateScanLogRepository;
    private final TicketQrTokenRepository ticketQrTokenRepository;
    private final TicketRepository ticketRepository;
    private final StationRepository stationRepository;

    @Transactional
    public GateScanResponse scan(ScanTicketRequest request) {
        LocalDateTime now = LocalDateTime.now();

        if (!StringUtils.hasText(request.getGateId())) {
            return buildDenyResponse(null, null, null, null, null,
                    "Gate id is required", now);
        }

        Gate gate = gateRepository.findById(request.getGateId()).orElse(null);

        if (gate == null) {
            return buildDenyResponse(null, null, null, null, null,
                    ErrorCode.GATE_NOT_FOUND.getMessage(), now);
        }

        // Check gate belongs to station
        if (gate.getStation() == null) {
            return denyAndLog(gate, null, null,
                    "Gate station is missing", now);
        }

        if (StringUtils.hasText(request.getStationId())
                && (gate.getStation() != null)
                && !Objects.equals(request.getStationId(), gate.getStation().getStationId())) {
            return denyAndLog(gate, null, null,
                    "Station does not match gate", now);
        }

        if (gate.getStatus() != GateStatus.ACTIVE) {
            return denyAndLog(gate, null, null, ErrorCode.GATE_NOT_ACTIVE.getMessage(), now);
        }

        String tokenValue = extractToken(request.getQrContent());

        if (!StringUtils.hasText(tokenValue)) {
            return denyAndLog(gate, null, null, ErrorCode.QR_TOKEN_EMPTY.getMessage(), now);
        }

        Optional<TicketQrToken> qrTokenOptional = ticketQrTokenRepository.findByToken(tokenValue);

        if (qrTokenOptional.isEmpty()) {
            return denyAndLog(gate, null, null, ErrorCode.QR_TOKEN_INVALID.getMessage(), now);
        }

        TicketQrToken qrToken = qrTokenOptional.get();
        Ticket ticket = qrToken.getTicket();

        if (qrToken.getUsedAt() != null) {
            return denyAndLog(gate, ticket, qrToken, ErrorCode.QR_TOKEN_USED.getMessage(), now);
        }

        if (qrToken.getRevokedAt() != null) {
            return denyAndLog(gate, ticket, qrToken, ErrorCode.QR_TOKEN_REVOKE.getMessage(), now);
        }

        if (qrToken.getExpiresAt() == null || qrToken.getExpiresAt().isBefore(now)) {
            return denyAndLog(gate, ticket, qrToken, ErrorCode.QR_TOKEN_EXPIRED.getMessage(), now);
        }

        if (ticket.getExpiredAt() != null && ticket.getExpiredAt().isBefore(now)) {
            updateExpiredTicketStatus(ticket, now);
            ticketRepository.save(ticket);
            return denyAndLog(gate, ticket, qrToken, ErrorCode.TICKET_EXPIRED.getMessage(), now);
        }

        if (ticket.getStatus() == TicketStatus.USED) {
            return denyAndLog(gate, ticket, qrToken, ErrorCode.TICKET_ALREADY_USED.getMessage(), now);
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            return denyAndLog(gate, ticket, qrToken, ErrorCode.TICKET_CANCELLED.getMessage(), now);
        }

        if (ticket.getStatus() == TicketStatus.EXPIRED) {
            return denyAndLog(gate, ticket, qrToken, ErrorCode.TICKET_EXPIRED.getMessage(), now);
        }

        GateAction expectedAction = getExpectedAction(ticket);

        if (request.getAction() != null && request.getAction() != expectedAction) {
            return denyAndLog(gate, ticket, qrToken,
                    "Wrong scan action. Expected " + expectedAction, now);
        }

        if (gate.getAction() != expectedAction) {
            return denyAndLog(gate, ticket, qrToken,
                    "Wrong gate action. Expected " + expectedAction, now);
        }

        // Check route ticket
        boolean routeBasedTicket = !isDailyTicket(ticket) && !isMonthTicket(ticket);
        if (routeBasedTicket) {
            if (ticket.getOrderItem() == null
                    || ticket.getOrderItem().getFromStation() == null
                    || ticket.getOrderItem().getToStation() == null) {
                return denyAndLog(gate, ticket, qrToken,
                        "Ticket route information is missing", now);
            }

            Station expectedStation = expectedAction == GateAction.TAP_IN
                    ? ticket.getOrderItem().getFromStation()
                    : ticket.getOrderItem().getToStation();

            if (gate.getStation() == null
                    || !Objects.equals(gate.getStation().getStationId(), expectedStation.getStationId())) {
                return denyAndLog(gate, ticket, qrToken,
                        "Wrong station. Expected " + expectedStation.getName(), now);
            }
        }

        if (gate.getAction() == GateAction.TAP_IN) {
            ticket.setStatus(TicketStatus.ACTIVE);

            if (ticket.getActivatedAt() == null) {
                ticket.setActivatedAt(now);
            }
        } else if (gate.getAction() == GateAction.TAP_OUT) {
            if (routeBasedTicket) {
                ticket.setStatus(TicketStatus.USED);
                ticket.setUsedAt(now);

                qrToken.setUsedAt(now);
                ticketQrTokenRepository.save(qrToken);
            } else {
                ticket.setStatus(TicketStatus.ACTIVE);
            }
        }

        ticketRepository.save(ticket);

        GateScanLog log = gateScanLogRepository.save(
                GateScanLog.builder()
                        .gate(gate)
                        .station(gate.getStation())
                        .ticket(ticket)
                        .qrToken(qrToken)
                        .action(gate.getAction())
                        .result(ScanResult.ALLOW)
                        .message("Allow")
                        .scannedAt(now)
                        .build()
        );

        return GateScanResponse.builder()
                .result(log.getResult().name())
                .action(log.getAction().name())
                .message(log.getMessage())
                .ticketId(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .gateId(gate.getGateId())
                .stationId(gate.getStation().getStationId())
                .scannedAt(now)
                .build();
    }

    @Transactional(readOnly = true)
    public List<GateResponse> getGates(){
        return gateRepository.findAll()
                .stream()
                .map(this::toGateResponse)
                .toList();
    }

    @Transactional
    public GateResponse updateGateStatus(String gateId, UpdateGateStatusRequest request) {
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new AppException(ErrorCode.GATE_NOT_FOUND));

        gate.setStatus(request.getStatus());
        gate.setUpdatedAt(LocalDateTime.now());

        return toGateResponse(gateRepository.save(gate));
    }

    @Transactional(readOnly = true)
    public List<GateScanLogResponse> getLogs(
            String stationId,
            String gateId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return gateScanLogRepository.searchLogs(stationId, gateId, from, to)
                .stream()
                .map(this::toLogResponse)
                .toList();
    }

    private GateAction getExpectedAction(Ticket ticket) {

        // Card scan history query
        Optional<GateScanLog> lastAllowLog =
                gateScanLogRepository.findTopByTicketAndResultOrderByScannedAtDesc(ticket, ScanResult.ALLOW);

        // Card is new
        if (lastAllowLog.isEmpty()){
            return GateAction.TAP_IN;
        }

        // Card has history logs.
        if (lastAllowLog.get().getAction() == GateAction.TAP_IN){
            return GateAction.TAP_OUT;
        }
        return GateAction.TAP_IN;
    }

    private void updateExpiredTicketStatus(Ticket ticket, LocalDateTime now) {
        ticket.setStatus(TicketStatus.EXPIRED);

        if (ticket.getUsedAt() == null) {
            ticket.setUsedAt(now);
        }
    }

    private boolean isDailyTicket(Ticket ticket) {
        return getTicketName(ticket) == TicketName.Daily;
    }

    private boolean isMonthTicket(Ticket ticket) {
        return getTicketName(ticket) == TicketName.Month;
    }

    private TicketName getTicketName(Ticket ticket) {
        if (ticket == null
                || ticket.getOrderItem() == null
                || ticket.getOrderItem().getTicketType() == null) {
            return null;
        }

        return ticket.getOrderItem().getTicketType().getName();
    }


    private String extractToken(String qrContent){
        if (!StringUtils.hasText(qrContent)){
            return null;
        }

        // example: qr_token:9999 -> 9999
        if (qrContent.startsWith("qr_token:")){
            return qrContent.substring("qr_token:".length());
        }

        return qrContent;
    }

    private GateScanResponse denyAndLog(
            Gate gate,
            Ticket ticket,
            TicketQrToken qrToken,
            String message,
            LocalDateTime now
    ) {
        GateScanLog log = gateScanLogRepository.save(
                GateScanLog.builder()
                        .gate(gate)
                        .station(gate != null ? gate.getStation() : null)
                        .ticket(ticket)
                        .qrToken(qrToken)
                        .action(gate != null ? gate.getAction() : GateAction.TAP_IN)
                        .result(ScanResult.DENY)
                        .message(message)
                        .scannedAt(now)
                        .build()
        );

        return buildDenyResponse(
                gate,
                ticket,
                qrToken,
                log.getAction(),
                log.getResult(),
                message,
                now
        );
    }

    private GateScanResponse buildDenyResponse(
            Gate gate,
            Ticket ticket,
            TicketQrToken qrToken,
            GateAction action,
            ScanResult result,
            String message,
            LocalDateTime now
    ) {
        return GateScanResponse.builder()
                .result(result != null ? result.name() : ScanResult.DENY.name())
                .action(action != null ? action.name() : null)
                .message(message)
                .ticketId(ticket != null ? ticket.getId() : null)
                .ticketCode(ticket != null ? ticket.getTicketCode() : null)
                .gateId(gate != null ? gate.getGateId() : null)
                .stationId(gate != null && gate.getStation() != null ? gate.getStation().getStationId() : null)
                .scannedAt(now)
                .build();
    }

    private GateResponse toGateResponse(Gate gate) {
        return GateResponse.builder()
                .gateId(gate.getGateId())
                .gateCode(gate.getGateCode())
                .name(gate.getName())
                .stationId(gate.getStation() != null ? gate.getStation().getStationId() : null)
                .stationName(gate.getStation() != null ? gate.getStation().getName() : null)
                .action(gate.getAction().name())
                .status(gate.getStatus().name())
                .build();
    }

    private GateScanLogResponse toLogResponse(GateScanLog log) {
        return GateScanLogResponse.builder()
                .id(log.getId())
                .gateId(log.getGate() != null ? log.getGate().getGateId() : null)
                .gateCode(log.getGate() != null ? log.getGate().getGateCode() : null)
                .stationId(log.getStation() != null ? log.getStation().getStationId() : null)
                .stationName(log.getStation() != null ? log.getStation().getName() : null)
                .ticketId(log.getTicket() != null ? log.getTicket().getId() : null)
                .ticketCode(log.getTicket() != null ? log.getTicket().getTicketCode() : null)
                .action(log.getAction().name())
                .result(log.getResult().name())
                .message(log.getMessage())
                .scannedAt(log.getScannedAt())
                .build();
    }
    @Transactional(readOnly = true)
    public List<GateResponse> getGatesByStation(String stationId) {

        if(!stationRepository.existsById(stationId)){
            throw new AppException(ErrorCode.STATION_NOT_FOUND);
        }

        List<Gate> gates =gateRepository.findByStationStationId(stationId);
        return  gates.stream()
                .map(this::toGateResponse)
                .toList();
    }
}
