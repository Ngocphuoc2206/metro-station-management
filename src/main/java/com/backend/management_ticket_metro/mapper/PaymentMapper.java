package com.backend.management_ticket_metro.mapper;

import com.backend.management_ticket_metro.dto.response.PaymentResponse;
import com.backend.management_ticket_metro.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "order.orderId", target = "orderId")
    @Mapping(source = "expiredAt", target = "expiredAt")
    @Mapping(source = "transactionId", target = "providerTransactionId")
    PaymentResponse toPaymentResponse(Payment payment);
}
