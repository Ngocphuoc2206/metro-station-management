package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.*;
import com.backend.management_ticket_metro.entity.*;
import com.backend.management_ticket_metro.enums.TicketStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.OrderMapper;
import com.backend.management_ticket_metro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
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
                        .expiredAt(now.plusDays(resolveValidityDays(item.getTicketTypeId())))
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
            ticket.setStatus(TicketStatus.EXPIRED);
            ticketRepository.save(ticket);
        }
    }

    private TicketResponse toTicketResponse(Ticket ticket) {
        OrderItem item = ticket.getOrderItem();

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .status(ticket.getStatus().name())
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

        //Calculate the number of active tickets (ready or active and not yet expired).
        List<TicketStatus> activeStatuses = List.of(TicketStatus.READY, TicketStatus.ACTIVE);
        long activeTickets = ticketRepository.countByUserAndStatusInAndExpiredAtAfter(user, activeStatuses, now);

        //Calculate the total number of successful trips.
        long totalTrips = ticketUsageRepository.countByTicketUserAndSuccessTrue(user);

        //Take the 3 most recent tickets.
        Pageable topThree = PageRequest.of(0, 3);
        List<TicketResponse> recentTickets = ticketRepository.findByUserOrderByIssuedAtDesc(user, topThree)
                .stream()
                .map(this::toTicketResponse)
                .toList();

        //Take the last 5 trips (card swipes)
        Pageable topFive = PageRequest.of(0, 5);
        List<TicketUsageResponse> recentTrips = ticketUsageRepository.findByTicketUserOrderByScannedAtDesc(user, topFive)
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

        //Get the latest order.
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
}
