package com.backend.management_ticket_metro.util;

import java.text.Normalizer;
import java.util.Locale;

public final class TicketTypeNameUtils {
    private static final String SINGLE_TICKET = "Single";
    private static final String DAILY_TICKET = "Daily";
    private static final String MONTH_TICKET = "Month";

    private TicketTypeNameUtils() {
    }

    public static String normalize(String ticketName) {
        if (ticketName == null) {
            return null;
        }

        String normalizedKey = toLookupKey(ticketName);

        return switch (normalizedKey) {
            case "single", "ve luot", "vé lượt" -> SINGLE_TICKET;
            case "daily", "ve ngay", "vé ngày" -> DAILY_TICKET;
            case "month", "monthly", "ve thang", "vé tháng" -> MONTH_TICKET;
            default -> ticketName.trim();
        };
    }

    public static boolean isSingle(String ticketName) {
        return SINGLE_TICKET.equalsIgnoreCase(normalize(ticketName));
    }

    public static boolean isDaily(String ticketName) {
        return DAILY_TICKET.equalsIgnoreCase(normalize(ticketName));
    }

    public static boolean isMonth(String ticketName) {
        return MONTH_TICKET.equalsIgnoreCase(normalize(ticketName));
    }

    public static boolean isFixedPriceTicket(String ticketName) {
        return isDaily(ticketName) || isMonth(ticketName);
    }

    private static String toLookupKey(String value) {
        String withoutAccent = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');

        return withoutAccent.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
