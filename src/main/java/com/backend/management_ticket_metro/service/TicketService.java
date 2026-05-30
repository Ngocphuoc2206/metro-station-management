package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.*;
import com.backend.management_ticket_metro.entity.*;
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
    private final StationRepository stationRepository;

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

    @Transactional(readOnly = true)
    public PageResponse<TripResponse> getMyTripHistory(
            int page, int limit, LocalDateTime from, LocalDateTime to, String stationId) {

        log.info("Get my trips history stationId: {}", stationId);

        User user = getCurrentUser();

        // 1. Lấy tất cả các vé của user
        List<Ticket> tickets = ticketRepository.findByUser(user);

        if (tickets.isEmpty()) {
            log.warn("User has no tickets");
            return PageResponse.<TripResponse>builder().items(new ArrayList<>()).page(page).limit(limit).total(0).build();
        }

        Set<String> ticketIds = tickets.stream()
                .map(Ticket::getId)
                .collect(Collectors.toSet());

        List<TicketUsage> rawLogs = ticketUsageRepository.findTripHistoryRaw(user, ticketIds, stationId, from, to);

        if (rawLogs.isEmpty()) {
            log.warn("Rawlogs is empty");
            return PageResponse.<TripResponse>builder().items(new ArrayList<>()).page(page).limit(limit).total(0).build();
        }

        // Chỉ lấy các Station ID có trong log
        Set<String> stationIdsInLogs = rawLogs.stream()
                .map(TicketUsage::getStationId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, String> stationNameMap = stationRepository.findByStationIdIn(stationIdsInLogs).stream()
                .collect(Collectors.toMap(Station::getStationId, Station::getName, (oldVal, newVal) -> oldVal));

        // Nhóm theo Ticket ID
        Map<String, List<TicketUsage>> logsByTicket = rawLogs.stream()
                .collect(Collectors.groupingBy(tu -> tu.getTicket().getId()));

        List<TripResponse> allTrips = new ArrayList<>();

        // Thuật toán ghép cặp (Đi từ CŨ nhất đến MỚI nhất)
        for (Map.Entry<String, List<TicketUsage>> entry : logsByTicket.entrySet()) {
            String tId = entry.getKey();
            List<TicketUsage> ticketLogs = entry.getValue();

            // Đảm bảo log được xếp từ cũ đến mới để thuật toán chạy đúng
            ticketLogs.sort(Comparator.comparing(TicketUsage::getScannedAt));

            TicketUsage tempTapIn = null;

            for (TicketUsage log : ticketLogs) {
                String currentStationName = stationNameMap.getOrDefault(log.getStationId(), "Unknown Station");
                boolean isTapOut = log.getGateId() != null && log.getGateId().contains("OUT");

                if (!isTapOut) {
                    // Nếu gặp TAP_IN mới
                    if (tempTapIn != null) {
                        // Chuyến trước đó bị quên TAP_OUT -> Đóng chuyến trước đó dạng IN_COMPLETE hoặc IN_PROGRESS
                        allTrips.add(buildTrip(tempTapIn, null, tId, stationNameMap));
                    }
                    tempTapIn = log; // Giữ lại TAP_IN hiện tại
                } else {
                    // Nếu gặp TAP_OUT
                    if (tempTapIn != null) {
                        // Có cặp hoàn chỉnh
                        allTrips.add(buildTrip(tempTapIn, log, tId, stationNameMap));
                        tempTapIn = null; // Reset
                    } else {
                        // Xuất hiện TAP_OUT không có TAP_IN (Lỗi quẹt thẻ đầu vào)
                        allTrips.add(buildTrip(null, log, tId, stationNameMap));
                    }
                }
            }

            // Xử lý log cuối cùng nếu nó là một TAP_IN chưa có TAP_OUT (Chuyến đi đang diễn ra)
            if (tempTapIn != null) {
                allTrips.add(buildTrip(tempTapIn, null, tId, stationNameMap));
            }
        }

        //Sắp xếp lại danh sách trip cuối cùng: MỚI NHẤT lên đầu để hiển thị
        allTrips.sort((t1, t2) -> t2.getCheckIn().compareTo(t1.getCheckIn()));

        // 5. Phân trang thủ công (Hạn chế lỗi Index Out Of Bound)
        int totalItems = allTrips.size();
        int fromIndex = Math.min((page - 1) * limit, totalItems);
        int toIndex = Math.min(fromIndex + limit, totalItems);

        List<TripResponse> pagedTrips = (fromIndex < totalItems) ? allTrips.subList(fromIndex, toIndex) : new ArrayList<>();

        return PageResponse.<TripResponse>builder()
                .items(pagedTrips)
                .page(page)
                .limit(limit)
                .total(totalItems)
                .build();
    }

    // Hàm bổ trợ build Trip gọn gàng và an toàn hơn
    private TripResponse buildTrip(TicketUsage tapIn, TicketUsage tapOut, String ticketId, Map<String, String> stationNameMap) {
        String idSource = tapIn != null ? tapIn.getId() : (tapOut != null ? tapOut.getId() : UUID.randomUUID().toString());
        String tripId = "TRIP-" + (idSource.length() > 8 ? idSource.substring(0, 8) : idSource);

        String origin = tapIn != null ? stationNameMap.getOrDefault(tapIn.getStationId(), "Unknown Station") : "No Check-in";
        String dest = tapOut != null ? stationNameMap.getOrDefault(tapOut.getStationId(), "Unknown Station") : "In Transit";

        return TripResponse.builder()
                .id(tripId)
                .ticketId(ticketId)
                .originStation(origin)
                .destinationStation(dest)
                .checkIn(tapIn != null ? tapIn.getScannedAt() : null)
                .checkOut(tapOut != null ? tapOut.getScannedAt() : null)
                .status(tapIn != null && tapOut != null ? "COMPLETED" : (tapIn != null ? "IN_PROGRESS" : "INCOMPLETE_DATA"))
                .build();
    }
}
