package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Repository
public interface StationRepository extends JpaRepository<Station, String> {

    List<Station> findByStationIdIn(Collection<String> stationIds);
}
