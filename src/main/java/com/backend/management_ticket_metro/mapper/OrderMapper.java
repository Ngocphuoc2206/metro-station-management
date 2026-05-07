package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.response.OrderItemResponse;
import com.backend.management_ticket_metro.dto.response.OrderResponse;
import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.entity.OrderItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    OrderResponse toOrderResponse(Order order);
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);
}
