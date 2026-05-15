package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.GateAction;
import com.backend.management_ticket_metro.enums.ScanResult;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "gate_scan_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GateScanLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    private Gate gate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_token_id")
    private TicketQrToken qrToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GateAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ScanResult result;

    @Column(length = 255)
    private String message;

    private LocalDateTime scannedAt;
}
