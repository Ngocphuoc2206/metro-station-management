package com.backend.management_ticket_metro.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsRequest {
    private Boolean emailNotification;
    private Boolean smsNotification;
}
