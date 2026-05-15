package com.backend.management_ticket_metro.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.backend.management_ticket_metro.enums.DeviceStatus;

@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Devices {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "device_code", nullable = false, unique = true, length = 50)
    private String deviceCode;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    private Gate gate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeviceStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
