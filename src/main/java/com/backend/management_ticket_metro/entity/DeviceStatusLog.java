package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_statuslog")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceStatusLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    private String previousStatus;
    private String currentStatus;
    private String reason;
    private LocalDateTime createdAt;
    private String updatedBy;
}
