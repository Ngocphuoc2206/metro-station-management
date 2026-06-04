package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.*;
import com.backend.management_ticket_metro.entity.*;
import com.backend.management_ticket_metro.enums.GateAction;
import com.backend.management_ticket_metro.enums.ScanResult;
import com.backend.management_ticket_metro.enums.TicketName;
import com.backend.management_ticket_metro.enums.TicketStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.OrderMapper;
import com.backend.management_ticket_metro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {
    // Set 10 minutes
    private static final long QR_TOKEN_TTL_SECONDS = 600;

    private final TicketRepository ticketRepository;
    private final TicketQrTokenRepository ticketQrTokenRepository;
    private final TicketUsageRepository ticketUsageRepository;
    private final UserRepository userRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final QRCodeService qrCodeService;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final GateScanLogRepository gateScanLogRepository;

    // Issuing Tickets
    @Transactional
    public void issueTicketsForPaidOrder(Order order){
        if (ticketRepository.existsByOrder(order)){
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        List<Ticket> tickets = new ArrayList<>();
        for (OrderItem item: order.getOrderItems()){
            int quantity = item.getQuantity() == null ? 0 : item.getQuantity();

            for (int i = 0; i < quantity; i++) {
                Ticket ticket = Ticket.builder()
                        .ticketCode(generateUniqueTicketCode())
                        .user(order.getUser())
                        .order(order)
                        .orderItem(item)
                        .status(TicketStatus.READY)
                        .issuedAt(now)
                        .expiredAt(now.plusDays(resolveValidityDays(item.getTicketType().getId())))
                        .build();

                tickets.add(ticket);
            }
        }
        ticketRepository.saveAll(tickets);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets() {
        User user = getCurrentUser();

        return ticketRepository.findByUserOrderByIssuedAtDesc(user)
                .stream()
                .map(this::toTicketResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getMyTicket(String ticketId){
        User user = getCurrentUser();

        Ticket ticket = ticketRepository.findByIdAndUser(ticketId, user)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_FOUND));

        return toTicketResponse(ticket);
    }

    @Transactional
    public TicketQrTokenResponse generateQrToken(String ticketId){
        User user = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        Ticket ticket = ticketRepository.findByIdAndUser(ticketId, user)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_FOUND));

        // refresh ticket expired
        refreshTicketStatus(ticket, now);

        if (ticket.getStatus() == TicketStatus.USED){
            throw new AppException(ErrorCode.TICKET_ALREADY_USED);
        }

        if (ticket.getStatus() == TicketStatus.EXPIRED) {
            throw new AppException(ErrorCode.TICKET_EXPIRED);
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new AppException(ErrorCode.TICKET_CANCELLED);
        }

        // get old token
        List<TicketQrToken> oldTokens =
                ticketQrTokenRepository.findByTicketAndUsedAtIsNullAndRevokedAtIsNullAndExpiresAtAfter(ticket, now);

        oldTokens.forEach(token -> token.setRevokedAt(now));
        ticketQrTokenRepository.saveAll(oldTokens);

        String tokenValue = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = now.plusSeconds(QR_TOKEN_TTL_SECONDS);
        // generate QR and upload
        String qrCodeUrl = qrCodeService.generateAndUploadTicketQR(tokenValue, ticket.getTicketCode());

        TicketQrToken qrToken = TicketQrToken.builder()
                .ticket(ticket)
                .token(tokenValue)
                .qrCodeUrl(qrCodeUrl)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        ticketQrTokenRepository.save(qrToken);

        return TicketQrTokenResponse.builder()
                .ticketId(ticket.getId())
                .qrToken(tokenValue)
                .qrContent("qr_token:" + tokenValue)
                .qrCodeUrl(qrCodeUrl)
                .expiresAt(expiresAt)
                .ttlSeconds(QR_TOKEN_TTL_SECONDS)
                .build();

    }

    @Transactional(readOnly = true)
    public List<TicketUsageResponse> getMyTicketHistory(String ticketId) {
        User user = getCurrentUser();

        Ticket ticket = ticketRepository.findByIdAndUser(ticketId, user)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_FOUND));

        return ticketUsageRepository.findByTicketOrderByScannedAtDesc(ticket)
                .stream()
                .map(usage -> TicketUsageResponse.builder()
                        .id(usage.getId())
                        .stationId(usage.getStationId())
                        .gateId(usage.getGateId())
                        .success(usage.getSuccess())
                        .message(usage.getMessage())
                        .scannedAt(usage.getScannedAt())
                        .build())
                .toList();
    }

    private User getCurrentUser() {
        String email = Objects.requireNonNull(
                SecurityContextHolder.getContext().getAuthentication()
        ).getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private String generateUniqueTicketCode() {
        String code;

        do {
            code = "TICKET-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (ticketRepository.existsByTicketCode(code));

        return code;
    }

    private int resolveValidityDays(String ticketTypeId) {
        if (ticketTypeId == null) {
            return 1;
        }

        return ticketTypeRepository.findById(ticketTypeId)
                .map(TicketType::getValidityDays)
                .filter(days -> days > 0)
                .orElse(1);
    }

    private void refreshTicketStatus(Ticket ticket, LocalDateTime now) {
        if (ticket.getExpiredAt() != null
                && ticket.getExpiredAt().isBefore(now)
                && ticket.getStatus() != TicketStatus.USED
                && ticket.getStatus() != TicketStatus.CANCELLED) {
            if (isMonthTicket(ticket)) {
                ticket.setStatus(TicketStatus.USED);

                if (ticket.getUsedAt() == null) {
                    ticket.setUsedAt(now);
                }
            } else {
                ticket.setStatus(TicketStatus.EXPIRED);
            }
            ticketRepository.save(ticket);
        }
    }

    private boolean isMonthTicket(Ticket ticket) {
        return ticket != null
                && ticket.getOrderItem() != null
                && ticket.getOrderItem().getTicketType() != null
                && ticket.getOrderItem().getTicketType().getName() == TicketName.Month;
    }

    private TicketResponse toTicketResponse(Ticket ticket) {
        OrderItem item = ticket.getOrderItem();
        String ticketTypeId = ticket.getOrderItem().getTicketType().getId();
        // get ticketType Name
        TicketType ticketType = ticketTypeRepository.findById(ticketTypeId)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .status(ticket.getStatus().name())
                .ticketTypeName(String.valueOf(ticketType.getName()))
                .issuedAt(ticket.getIssuedAt())
                .activatedAt(ticket.getActivatedAt())
                .usedAt(ticket.getUsedAt())
                .expiredAt(ticket.getExpiredAt())
                .orderId(ticket.getOrder().getOrderId())
                .orderItemId(item.getOrderItemId())
                .fromStationId(item.getFromStation() != null ? item.getFromStation().getStationId() : null)
                .toStationId(item.getToStation() != null ? item.getToStation().getStationId() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public PassengerDashboardResponse getPassengerDashboard() {
        User user = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        // Calculate the number of active tickets.
        List<TicketStatus> activeStatuses = List.of(TicketStatus.READY, TicketStatus.ACTIVE);
        long activeTickets = ticketRepository.countByUserAndStatusInAndExpiredAtAfter(
                user,
                activeStatuses,
                now
        );

        // Calculate completed trips from gate_scan_logs.
        // A completed trip is counted when user has successful TAP_OUT.
        long totalTrips = gateScanLogRepository.countCompletedTripsByUser(
                user,
                ScanResult.ALLOW,
                GateAction.TAP_OUT
        );

        // Take the 3 most recent tickets.
        Pageable topThree = PageRequest.of(0, 3);
        List<TicketResponse> recentTickets = ticketRepository.findByUserOrderByIssuedAtDesc(user, topThree)
                .stream()
                .map(this::toTicketResponse)
                .toList();

        // Take the 5 most recent gate scan logs.
        Pageable topFive = PageRequest.of(0, 5);
        List<TicketUsageResponse> recentTrips = gateScanLogRepository.findRecentScanLogsByUser(user,
                        (java.awt.print.Pageable) topFive)
                .stream()
                .map(this::toTicketUsageResponse)
                .toList();

        // Get the latest order.
        OrderResponse latestOrder = null;
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 1));
        if (!orders.isEmpty()) {
            latestOrder = orderMapper.toOrderResponse(orders.get(0));
        }

        return PassengerDashboardResponse.builder()
                .activeTickets(activeTickets)
                .totalTrips(totalTrips)
                .recentTickets(recentTickets)
                .recentTrips(recentTrips)
                .latestOrder(latestOrder)
                .build();
    }

    private TicketUsageResponse toTicketUsageResponse(GateScanLog log) {
        return TicketUsageResponse.builder()
                .id(log.getId())
                .stationId(log.getStation() != null ? log.getStation().getStationId() : null)
                .gateId(log.getGate() != null ? log.getGate().getGateId() : null)
                .success(log.getResult() == ScanResult.ALLOW)
                .message(buildGateScanMessage(log))
                .scannedAt(log.getScannedAt())
                .build();
    }

    private String buildGateScanMessage(GateScanLog log) {
        String action = log.getAction() != null ? log.getAction().name() : "UNKNOWN";
        String message = log.getMessage();

        if (message == null || message.isBlank()) {
            return action;
        }

        return action + " - " + message;
    }

    @Transactional(readOnly = true)
    public PageResponse<TripResponse> getMyTripHistory(
            int page, int limit, LocalDateTime from, LocalDateTime to, String stationId) {

        int safePage = Math.max(page, 1);
        int safeLimit = Math.max(limit, 1);
        stationId = normalizeStationId(stationId);

        log.info("Get my trips history stationId: {}", stationId);

        User user = getCurrentUser();

        List<GateScanLog> rawLogs = gateScanLogRepository.findMyTripLogs(
                user,
                ScanResult.ALLOW,
                stationId,
                from,
                to
        );

        if (rawLogs.isEmpty()) {
            log.warn("Gate scan logs is empty");
            return PageResponse.<TripResponse>builder()
                    .items(new ArrayList<>())
                    .page(safePage)
                    .limit(safeLimit)
                    .total(0)
                    .build();
        }

        Map<String, List<GateScanLog>> logsByTicket = rawLogs.stream()
                .filter(log -> log.getTicket() != null)
                .collect(Collectors.groupingBy(log -> log.getTicket().getId()));

        List<TripResponse> allTrips = new ArrayList<>();

        for (Map.Entry<String, List<GateScanLog>> entry : logsByTicket.entrySet()) {
            String ticketId = entry.getKey();
            List<GateScanLog> ticketLogs = entry.getValue();

            ticketLogs.sort(Comparator.comparing(GateScanLog::getScannedAt));

            GateScanLog tempTapIn = null;

            for (GateScanLog log : ticketLogs) {
                if (log.getAction() == GateAction.TAP_IN) {
                    if (tempTapIn != null) {
                        allTrips.add(buildTrip(tempTapIn, null, ticketId));
                    }

                    tempTapIn = log;
                }

                if (log.getAction() == GateAction.TAP_OUT) {
                    if (tempTapIn != null) {
                        allTrips.add(buildTrip(tempTapIn, log, ticketId));
                        tempTapIn = null;
                    } else {
                        allTrips.add(buildTrip(null, log, ticketId));
                    }
                }
            }

            if (tempTapIn != null) {
                allTrips.add(buildTrip(tempTapIn, null, ticketId));
            }
        }

        allTrips.sort(
                Comparator.comparing(
                        this::getTripSortTime,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).reversed()
        );

        int totalItems = allTrips.size();
        int fromIndex = Math.min((safePage - 1) * safeLimit, totalItems);
        int toIndex = Math.min(fromIndex + safeLimit, totalItems);

        List<TripResponse> pagedTrips = fromIndex < totalItems
                ? allTrips.subList(fromIndex, toIndex)
                : new ArrayList<>();

        return PageResponse.<TripResponse>builder()
                .items(pagedTrips)
                .page(safePage)
                .limit(safeLimit)
                .total(totalItems)
                .build();
    }

    private String normalizeStationId(String stationId) {
        if (stationId == null || stationId.isBlank() || stationId.equalsIgnoreCase("all")) {
            return null;
        }

        return stationId;
    }

    private TripResponse buildTrip(GateScanLog tapIn, GateScanLog tapOut, String ticketId) {
        String idSource = tapIn != null
                ? tapIn.getId()
                : tapOut != null ? tapOut.getId() : UUID.randomUUID().toString();

        String tripId = "TRIP-" + (idSource.length() > 8 ? idSource.substring(0, 8) : idSource);

        String originStation = tapIn != null
                ? getStationName(tapIn, "Unknown Station")
                : "No Check-in";

        String destinationStation = tapOut != null
                ? getStationName(tapOut, "Unknown Station")
                : "In Transit";

        return TripResponse.builder()
                .id(tripId)
                .ticketId(ticketId)
                .originStation(originStation)
                .destinationStation(destinationStation)
                .checkIn(tapIn != null ? tapIn.getScannedAt() : null)
                .checkOut(tapOut != null ? tapOut.getScannedAt() : null)
                .status(resolveTripStatus(tapIn, tapOut))
                .build();
    }

    private String getStationName(GateScanLog log, String fallback) {
        if (log == null || log.getStation() == null) {
            return fallback;
        }

        return log.getStation().getName();
    }

    private String resolveTripStatus(GateScanLog tapIn, GateScanLog tapOut) {
        if (tapIn != null && tapOut != null) {
            return "COMPLETED";
        }

        if (tapIn != null) {
            return "IN_PROGRESS";
        }

        return "INCOMPLETE_DATA";
    }

    private LocalDateTime getTripSortTime(TripResponse trip) {
        if (trip.getCheckOut() != null) {
            return trip.getCheckOut();
        }

        return trip.getCheckIn();
    }
}
