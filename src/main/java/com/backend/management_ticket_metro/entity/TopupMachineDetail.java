package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "topupmachine_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopupMachineDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String deviceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    private String readerFirmwareVersion;
    private Double maxTopupLimit;
}
