package com.backend.management_ticket_metro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {
    @Id
    @Column(name = "permission_name", length = 100)
    private String name;

    @Column(name = "description")
    private String description;
}