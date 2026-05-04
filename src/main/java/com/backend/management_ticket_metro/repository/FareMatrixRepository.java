package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.FareMatrix;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FareMatrixRepository extends JpaRepository<FareMatrix, Long> {

    Optional<FareMatrix> findByOriginStationIdAndDestinationStationId(
            String originStationId, String destinationStationId
    );
}
