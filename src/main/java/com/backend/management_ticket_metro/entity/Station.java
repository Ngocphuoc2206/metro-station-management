package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.StationStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Station {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "station_id", length = 50, nullable = false)
    private String stationId;

    @Column(name = "name" , length = 255, nullable = false)
    private String name;

    @Column(name = "add_ress" , length = 255, nullable = false)
    private String address;

    @Column(name = "la_titude" , length = 30)
    private Double latitude;

    @Column(name = "long_itude" , length = 30 )
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private StationStatus status;
}
