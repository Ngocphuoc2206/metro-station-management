package com.backend.management_ticket_metro.dto.response;

import com.backend.management_ticket_metro.enums.TicketStatus;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> items ;
    private int page;
    private int limit;
    private int total;
}
