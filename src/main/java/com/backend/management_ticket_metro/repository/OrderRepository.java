package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order,String> {
    List<Order> findByUser(User user);
}
