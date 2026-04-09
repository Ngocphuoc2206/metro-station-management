package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.RouteStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "routes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "route_id", length = 50, nullable = false)
    private String routeId;

    @Column(name = "route_name", length = 255,unique = true, nullable = false)
    private String routeName;

    @Column(name = "route_Code")
    private String routeCode;

    @Column(name = "color")
    private String color;

    @Column(name = "status", length = 30 ,nullable = false)
    @Enumerated(EnumType.STRING)
    private RouteStatus status;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL)
    private List<RouteStation> routeStations;
}
