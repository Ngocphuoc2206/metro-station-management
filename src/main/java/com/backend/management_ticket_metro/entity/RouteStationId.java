package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteStationId implements Serializable {
    private String route;
    private String station;
}