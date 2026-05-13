package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ticketmachine_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMachineDetail {
    @Id
    private String deviceId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "device_id")
    private Device device;

    private int card_stock_level;
    private String accepted_payment_methods;
    private boolean cash_box_full;
    private Integer printer_ink_level;
}
