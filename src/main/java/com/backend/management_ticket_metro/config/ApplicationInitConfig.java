package com.backend.management_ticket_metro.config;

import com.backend.management_ticket_metro.constant.PredefinedAccount;
import com.backend.management_ticket_metro.constant.PredefinedRole;
import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.entity.TicketType;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.enums.TicketName;
import com.backend.management_ticket_metro.enums.UserStatus;
import com.backend.management_ticket_metro.repository.PermissionRepository;
import com.backend.management_ticket_metro.repository.RoleRepository;
import com.backend.management_ticket_metro.repository.TicketTypeRepository;
import com.backend.management_ticket_metro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ApplicationInitConfig {

    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final TicketTypeRepository ticketTypeRepository;


    @Bean
    @ConditionalOnProperty(
            prefix = "spring.datasource",
            value = "driver-class-name",
            havingValue = "com.mysql.cj.jdbc.Driver"
    )
    ApplicationRunner applicationRunner(UserRepository userRepository) {
        log.info("Initializing application....");

        return args -> {
            if (permissionRepository.count() == 0) {
                permissionRepository.save(com.backend.management_ticket_metro.entity.Permission.builder()
                        .name("CREATE_STATION").description("Cho phép tạo trạm").build());
                permissionRepository.save(com.backend.management_ticket_metro.entity.Permission.builder()
                        .name("UPDATE_STATION").description("Cho phép cập nhập").build());
                permissionRepository.save(com.backend.management_ticket_metro.entity.Permission.builder()
                        .name("DELETE_STATION").description("Cho phép xóa trạm").build());
                permissionRepository.save(com.backend.management_ticket_metro.entity.Permission.builder()
                        .name("VIEW_STATION").description("Cho phép xem trạm").build());
            }
            permissionRepository.findAll();

            // Init Ticket-Types
            if (ticketTypeRepository.count() == 0){
                ticketTypeRepository.save(
                        TicketType.builder()
                                .name(TicketName.Daily)
                                .isActive(true)
                                .price(1000.0)
                                .description("Vé lượt dùng để quét 1 lần trong ngày")
                                .validityDays(1)
                                .build()
                );

                ticketTypeRepository.save(
                        TicketType.builder()
                                .name(TicketName.Month)
                                .isActive(true)
                                .price(100000.0)
                                .description("Vé lượt dùng để quét trong cả tháng")
                                .validityDays(30)
                                .build()
                );
            }


                Role passengerRole = roleRepository.findByRoleName(PredefinedRole.USER_ROLE)
                        .orElseGet(() -> roleRepository.save(
                                Role.builder()
                                        .roleId("ROLE_" + PredefinedRole.USER_ROLE)
                                        .roleName(PredefinedRole.USER_ROLE)
                                        .build()
                        ));

                Role staffRole = roleRepository.findByRoleName(PredefinedRole.STAFF_ROLE)
                        .orElseGet(() -> roleRepository.save(
                                Role.builder()
                                        .roleId("ROLE_" + PredefinedRole.STAFF_ROLE)
                                        .roleName(PredefinedRole.STAFF_ROLE)
                                        .build()
                        ));

                Role adminRole = roleRepository.findByRoleName(PredefinedRole.ADMIN_ROLE)
                        .orElseGet(() -> roleRepository.save(
                                Role.builder()
                                        .roleId("ROLE_" + PredefinedRole.ADMIN_ROLE)
                                        .roleName(PredefinedRole.ADMIN_ROLE)
                                        .build()
                        ));

                if(userRepository.findByEmail(PredefinedAccount.STAFF_USER_NAME).isEmpty()){
                    Set<Role> staffRoles = new HashSet<>();
                    staffRoles.add(staffRole);

                    User staffUser = User.builder()
                            .email(PredefinedAccount.STAFF_USER_NAME)
                            .passwordHash(passwordEncoder.encode(PredefinedAccount.STAFF_PASSWORD))
                            .fullName("STAFF")
                            .roles(staffRoles)
                            .status(UserStatus.ACTIVE)
                            .build();
                    userRepository.save(staffUser);
                    log.warn("Staff user created with default password");
                }

                if (userRepository.findByEmail(PredefinedAccount.ADMIN_USER_NAME).isEmpty()) {
                    Set<Role> adminRoles = new HashSet<>();
                    adminRoles.add(adminRole);

                    User adminUser = User.builder()
                            .email(PredefinedAccount.ADMIN_USER_NAME)
                            .passwordHash(passwordEncoder.encode(PredefinedAccount.ADMIN_PASSWORD))
                            .fullName("ADMIN")
                            .roles(adminRoles)
                            .status(UserStatus.ACTIVE)
                            .build();

                    userRepository.save(adminUser);
                    log.warn("admin user has been created with default password: admin, please change it");
            }

            log.info("Application initialization completed .....");
        };
    }
}