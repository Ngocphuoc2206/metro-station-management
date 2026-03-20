package com.backend.management_ticket_metro.validator;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class PasswordPolicyValidator {
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.#_\\-])[A-Za-z\\d@$!%*?&.#_\\-]{8,50}$"
    );

    public boolean isValid(String password){
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    public String getRulesDescription(){
        return "Password must be 8-50 characters and include at least 1 uppercase letter" +
                ", 1 lowercase letter, 1 number, and 1 special character";
    }
}
