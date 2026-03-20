package com.backend.management_ticket_metro.config;

import com.backend.management_ticket_metro.constant.PredefinedRole;
import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;

    private final RoleRepository roleRepository;

    @Bean
    public ApplicationRunner seedRoles(){
        return args -> {
            List<String> roles = List.of(PredefinedRole.USER_ROLE, PredefinedRole.ADMIN_ROLE, PredefinedRole.STAFF_ROLE);
            for(String roleName: roles){
                boolean exists = roleRepository.findByRoleName(roleName).isPresent();
                if (!exists){
                    Role role = new Role();
                    role.setRoleId("ROLE_" + roleName);
                    role.setRoleName(roleName);

                    roleRepository.save(role);
                }
            }
        };
    }
}
