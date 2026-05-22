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
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Devices devices;

    private int card_stock_level;
    private String accepted_payment_methods;
    private boolean cash_box_full;
    private Integer printer_ink_level;
}
