package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "route_stations")
@IdClass(RouteStationId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteStation{
    @Id
    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @Id
    @ManyToOne
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @Column(name = "station_order")
    private int stationOrder;

    @Column(name = "travel_TimeNext")
    private int travelTimeNext;

    @Column(name = "distance_Next")
    private Double distanceNext;
}
