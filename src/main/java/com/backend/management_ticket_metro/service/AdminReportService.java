package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.*;
import com.backend.management_ticket_metro.enums.*;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportService {

    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final GateScanLogRepository gateScanLogRepository;
    private final IncidentRepository incidentRepository;
    private final DevicesRepository devicesRepository;

    public AdminDashboardSummaryResponse getDashboardSummary(String range, LocalDate from, LocalDate to, String stationId, String routeId) {
        TimeFrame frame = calculateTimeFrame(range, from, to);

        // 1. Thống kê Doanh thu & Tổng Đơn hàng (Chỉ tính đơn đã PAID)
        // Lưu ý: Đối với việc filter Route/Station cho Doanh thu, ta cần tính toán dựa trên dữ liệu OrderItem
        Double totalRevenue = orderRepository.calculateTotalRevenue(frame.start, frame.end, stationId, routeId);
        if (totalRevenue == null) totalRevenue = 0.0;

        // 2. Tổng số vé bán ra
        Long totalTicketsSold = ticketRepository.countTicketsSold(frame.start, frame.end, stationId, routeId);

        // 3. Tổng số chuyến đi hoàn thành (TAP_OUT thành công)
        Long totalTripsCompleted = gateScanLogRepository.countTripsCompleted(frame.start, frame.end, stationId, routeId);

        // 4. Số sự cố đang hoạt động (Chưa CLOSED)
        Long activeIncidentsCount = incidentRepository.countActiveIncidents(stationId);

        // 5. Số thiết bị đang báo lỗi (ERROR hoặc MAINTENANCE)
        Long errorDevicesCount = devicesRepository.countByStatusInAndStation_StationId(
                List.of(DeviceStatus.ERROR, DeviceStatus.MAINTENANCE), stationId
        );

        // 6. Phân loại vé bán ra
        List<Object[]> rawTicketTypes = ticketRepository.countTicketsGroupedByType(frame.start, frame.end, stationId, routeId);
        Map<String, Long> ticketsByType = rawTicketTypes.stream()
                .collect(Collectors.toMap(
                        obj -> String.valueOf(obj[0]),
                        obj -> (Long) obj[1]
                ));

        return AdminDashboardSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalTicketsSold(totalTicketsSold)
                .totalTripsCompleted(totalTripsCompleted)
                .activeIncidentsCount(activeIncidentsCount)
                .totalErrorDevicesCount(errorDevicesCount)
                .ticketsByType(ticketsByType)
                .build();
    }

    public List<RevenueReportPoint> getRevenueReport(String range, LocalDate from, LocalDate to, String stationId, String routeId) {
        TimeFrame frame = calculateTimeFrame(range, from, to);
        List<Object[]> rawData = orderRepository.getRevenueReportByDate(frame.start, frame.end, stationId, routeId);

        return rawData.stream().map(obj -> RevenueReportPoint.builder()
                        .date(LocalDate.parse(String.valueOf(obj[0])))
                        .revenue((Double) obj[1])
                        .orderCount((Long) obj[2])
                        .build())
                .sorted(Comparator.comparing(RevenueReportPoint::getDate))
                .toList();
    }

    public List<TicketSalesReportPoint> getTicketSalesReport(String range, LocalDate from, LocalDate to, String stationId, String routeId) {
        TimeFrame frame = calculateTimeFrame(range, from, to);
        List<Object[]> rawData = ticketRepository.getTicketSalesReportByDate(frame.start, frame.end, stationId, routeId);

        return rawData.stream().map(obj -> TicketSalesReportPoint.builder()
                        .date(LocalDate.parse(String.valueOf(obj[0])))
                        .ticketTypeName(String.valueOf(obj[1]))
                        .quantitySold((Long) obj[2])
                        .amount((Double) obj[3])
                        .build())
                .sorted(Comparator.comparing(TicketSalesReportPoint::getDate))
                .toList();
    }

    public List<TripsReportPoint> getTripsReport(String range, LocalDate from, LocalDate to, String stationId, String routeId) {
        TimeFrame frame = calculateTimeFrame(range, from, to);
        List<Object[]> rawData = gateScanLogRepository.getTripsReportByDate(frame.start, frame.end, stationId, routeId);

        return rawData.stream().map(obj -> TripsReportPoint.builder()
                        .date(LocalDate.parse(String.valueOf(obj[0])))
                        .completedTrips((Long) obj[1])
                        .inProgressTrips((Long) obj[2])
                        .incompleteTrips((Long) obj[3])
                        .build())
                .sorted(Comparator.comparing(TripsReportPoint::getDate))
                .toList();
    }

    public List<GateActivityReportPoint> getGateActivityReport(String range, LocalDate from, LocalDate to, String stationId) {
        TimeFrame frame = calculateTimeFrame(range, from, to);
        List<Object[]> rawData = gateScanLogRepository.getGateActivityReport(frame.start, frame.end, stationId);

        return rawData.stream().map(obj -> GateActivityReportPoint.builder()
                        .gateId(String.valueOf(obj[0]))
                        .gateCode(String.valueOf(obj[1]))
                        .gateName(String.valueOf(obj[2]))
                        .stationName(String.valueOf(obj[3]))
                        .totalScanCount((Long) obj[4])
                        .allowCount((Long) obj[5])
                        .denyCount((Long) obj[6])
                        .build())
                .toList();
    }

    public List<DeviceAlertReportPoint> getDeviceAlertsReport(String stationId) {
        // Chỉ lấy những thiết bị lỗi đi kèm thông tin Incident chưa được giải quyết (Khác CLOSED)
        List<Object[]> rawData = devicesRepository.getDeviceAlertsWithActiveIncidents(stationId);

        return rawData.stream().map(obj -> DeviceAlertReportPoint.builder()
                        .deviceId(String.valueOf(obj[0]))
                        .deviceCode(String.valueOf(obj[1]))
                        .deviceName(String.valueOf(obj[2]))
                        .deviceType(String.valueOf(obj[3]))
                        .stationName(String.valueOf(obj[4]))
                        .currentStatus(String.valueOf(obj[5]))
                        .incidentTitle(String.valueOf(obj[6]))
                        .incidentPriority(String.valueOf(obj[7]))
                        .reportedAt((LocalDateTime) obj[8])
                        .build())
                .toList();
    }

    // Helper Class & Method xử lý khoảng thời gian linh hoạt
    private static class TimeFrame {
        LocalDateTime start;
        LocalDateTime end;
        TimeFrame(LocalDateTime start, LocalDateTime end) {
            this.start = start;
            this.end = end;
        }
    }

    private TimeFrame calculateTimeFrame(String range, LocalDate from, LocalDate to) {
        LocalDateTime start = LocalDateTime.now().minusDays(30).with(LocalTime.MIN); // mặc định 30 ngày
        LocalDateTime end = LocalDateTime.now().with(LocalTime.MAX);

        if (range != null && !range.isBlank()) {
            switch (range.toLowerCase()) {
                case "today" -> {
                    start = LocalDate.now().atStartOfDay();
                    end = LocalDateTime.now().with(LocalTime.MAX);
                }
                case "7d" -> start = LocalDate.now().minusDays(7).atStartOfDay();
                case "30d" -> start = LocalDate.now().minusDays(30).atStartOfDay();
            }
        } else if (from != null && to != null) {
            if (from.isAfter(to)) throw new AppException(ErrorCode.INVALID_REQUEST);
            start = from.atStartOfDay();
            end = to.atTime(LocalTime.MAX);
        }
        return new TimeFrame(start, end);
    }
}