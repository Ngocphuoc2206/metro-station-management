package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.OrderItemRequest;
import com.backend.management_ticket_metro.dto.request.OrderRequest;
import com.backend.management_ticket_metro.dto.response.OrderItemResponse;
import com.backend.management_ticket_metro.dto.response.OrderResponse;
import com.backend.management_ticket_metro.entity.*;
import com.backend.management_ticket_metro.enums.OrderStatus;
import com.backend.management_ticket_metro.enums.TicketName;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.OrderMapper;
import com.backend.management_ticket_metro.mapper.StationMapper;
import com.backend.management_ticket_metro.repository.OrderRepository;
import com.backend.management_ticket_metro.repository.StationRepository;
import com.backend.management_ticket_metro.repository.TicketTypeRepository;
import com.backend.management_ticket_metro.repository.UserRepository;
import lombok.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final StationRepository stationRepository;
    private final StationMapper stationMapper;

    private final TicketTypeRepository ticketTypeRepository;
    private final FareService fareService;

    @Transactional(readOnly = true)
    public OrderResponse previewOrder(OrderRequest request) {
        String email = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<OrderItemResponse> itemResponses = request.getItems().stream().map(orderItemRequest -> {
            Station fromStation = stationRepository.findById(orderItemRequest.getFromStationId())
                    .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));
            Station toStation = stationRepository.findById(orderItemRequest.getToStationId())
                    .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

            TicketType ticketType = ticketTypeRepository.findById(orderItemRequest.getTicketTypeId())
                    .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));

            Double dynamicPrice = fareService.calculateFare(
                    fromStation.getStationId(),
                    toStation.getStationId(),
                    String.valueOf(ticketType.getName()),
                    orderItemRequest.getDistance()
            );

            return OrderItemResponse.builder()
                    .ticketType(ticketType)
                    .quantity(orderItemRequest.getQuantity())
                    .unitprice(dynamicPrice)
                    .fromStation(stationMapper.toStationResponse(fromStation))
                    .toStation(stationMapper.toStationResponse(toStation))
                    .build();

        }).collect(Collectors.toList());
        double totalRespone = 0;
        for (OrderItemResponse i : itemResponses) {
            double intoMoneyResponse = i.getQuantity() * i.getUnitprice();
            totalRespone += intoMoneyResponse;
        }
        return OrderResponse.builder()
                .totalAmount(totalRespone)
                .status(OrderStatus.PENDING.name())
                .items(itemResponses)
                .build();
    }
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        String email = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Check duplicate order
        Order duplicateOrder = findDuplicatePendingOrder(user, request);
        if (duplicateOrder != null) {
            return orderMapper.toOrderResponse(duplicateOrder);
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        List<OrderItem> items = request.getItems().stream().map(itemReq -> {
            //find station go
            Station fromStation = stationRepository.findById(itemReq.getFromStationId())
                    .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));
            //find station end
            Station toStation = stationRepository.findById(itemReq.getToStationId())
                    .orElseThrow(() -> new AppException(ErrorCode.STATION_NOT_FOUND));

            TicketType ticketType = ticketTypeRepository.findById(itemReq.getTicketTypeId())
                    .orElseThrow(() -> new AppException(ErrorCode.TICKET_TYPE_INVALID));


            Double dynamicPrice = fareService.calculateFare(
                    fromStation.getStationId(),
                    toStation.getStationId(),
                    String.valueOf(ticketType.getName()),
                    itemReq.getDistance()
            );


            return OrderItem.builder()
                    .order(order)
                    .ticketType(ticketType)
                    .quantity(itemReq.getQuantity())
                    .unitprice(dynamicPrice)
                    .fromStation(fromStation)
                    .toStation(toStation)
                    .build();
        }).collect(Collectors.toList());

        double total = 0;
        for(OrderItem i : items){ // Iterate through each item (i) in the list (items)
            double intoMoney = i.getQuantity() * i.getUnitprice();
            total += intoMoney;
        }
        order.setTotalAmount(total);
        order.setOrderItems(items);

        Order savedOrder = orderRepository.save(order);
        return orderMapper.toOrderResponse(savedOrder);
    }
    @Transactional
    public OrderResponse getOrderById(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return orderMapper.toOrderResponse(order);
    }
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        List<Order> orders = orderRepository.findByStatus(status);
        //Is step Reponse with list
        return orders.stream()
                .map(orderMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    private Order findDuplicatePendingOrder(User user, OrderRequest request) {
        LocalDateTime twoMinutesAgo = LocalDateTime.now().minusMinutes(2);

        return orderRepository
                .findByUserAndStatusAndCreatedAtAfter(user, OrderStatus.PENDING, twoMinutesAgo)
                .stream()
                .filter(order -> isSameOrderItems(order.getOrderItems(), request.getItems()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.DUPLICATE_ORDER));
    }

    private boolean isSameOrderItems(List<OrderItem> dbItems, List<OrderItemRequest> regItems) {

        if(dbItems.size() != regItems.size()){
            return false;
        }

        for(OrderItemRequest reqItem : regItems){
            boolean matchFound = dbItems.stream().anyMatch(dbItem ->
                    dbItem.getFromStation().getStationId().equals(reqItem.getFromStationId()) &&
                            dbItem.getToStation().getStationId().equals(reqItem.getToStationId()) &&
                            dbItem.getTicketType().getId().equals(reqItem.getTicketTypeId()) &&
                            dbItem.getQuantity() == reqItem.getQuantity()
            );

            if(!matchFound){
                return false;
            }
        }
        return true;
    }
}
