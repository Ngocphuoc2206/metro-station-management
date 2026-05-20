package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.TrainDirection;
import com.backend.management_ticket_metro.enums.TrainStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "metro_trains")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetroTrain {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String trainCode;

    @Column(nullable = false)
    private String routeId;

    private String currentStationId;
    private String nextStationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainStatus status;

    @Builder.Default
    private Integer delayMinutes = 0;

    private Double lat;
    private Double lng;

    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
