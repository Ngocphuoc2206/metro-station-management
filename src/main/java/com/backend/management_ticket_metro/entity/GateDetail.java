package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gate_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    private String directionMode;
    private String gateType;
    private boolean emergencyMode;
    private Long passageCount;
}
