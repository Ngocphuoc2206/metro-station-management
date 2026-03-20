package com.backend.management_ticket_metro.common;

public final class EmailUtils {
    private EmailUtils(){}

    public static String normalize(String email){
        return email == null ? null : email.trim().toLowerCase();
    }
}
