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
    private String deviceCode;//ok

    @Column(nullable = false, length = 100)
    private String name;//ok

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    private Gate gate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeviceStatus status;//ok

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    //device cũ nhập vào
    private String ipAddress;
    private String macAddress;
    private LocalDateTime lastMaintenance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    private DeviceType type;

    @OneToOne(mappedBy = "devices", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private GateDetail gateDetail;

    @OneToOne(mappedBy = "devices", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TicketMachineDetail ticketMachineDetail;

    @OneToOne(mappedBy = "devices", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ScannerDetail scannerDetail;

}
