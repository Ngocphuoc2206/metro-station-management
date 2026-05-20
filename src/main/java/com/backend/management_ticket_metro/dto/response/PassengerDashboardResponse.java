package com.backend.management_ticket_metro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerDashboardResponse {
    //Số vé đang hoạt động/có thể sử dụng của User.
    private long activeTickets;
    //Tổng số chuyến đi mà hành khách đã thực hiện thành công.
    private long totalTrips;
    //Danh sách vé gần đây (ví dụ: lấy top 3 hoặc top 5 vé mới mua).
    private List<TicketResponse> recentTickets;
    //Lịch sử các lần quét thẻ/đi lại gần đây của User (ví dụ: top 5 lần quét gần nhất).
    private List<TicketUsageResponse> recentTrips;
    //Thông tin đơn hàng mới nhất của User (bao gồm cả trạng thái để FE hiển thị nếu họ chưa thanh toán).
    private OrderResponse latestOrder;
}