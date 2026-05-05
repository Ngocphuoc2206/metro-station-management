package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "fare_matrix")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FareMatrix {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String originStationId;

    private String destinationStationId;

    private Double price;
}
