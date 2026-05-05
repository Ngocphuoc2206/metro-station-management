package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ticket_type")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketType {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String Id;

    private String name;    // single, daily, monthly
    private String description;
    private Double price; // used for daily or monthly
    private Integer validityDays;
    private Boolean isActive;
}
