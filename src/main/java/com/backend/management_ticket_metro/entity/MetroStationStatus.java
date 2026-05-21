package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.StationLiveStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "metro_station_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetroStationStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String stationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StationLiveStatus status;

    private Integer congestionLevel;

    @Column(length = 500)
    private String message;

    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
