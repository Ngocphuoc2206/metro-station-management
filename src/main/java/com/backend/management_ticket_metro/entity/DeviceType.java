package com.backend.management_ticket_metro.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "device_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceType {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String typeName;
    private String description;

    @OneToMany(mappedBy = "type", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Device> devices;
}

