package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.GateAction;
import com.backend.management_ticket_metro.enums.GateStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "gates")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "gate_id")
    private String gateId;

    @Column(name = "gate_code", nullable = false, unique = true, length = 50)
    private String gateCode;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GateAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GateStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
