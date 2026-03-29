package com.expense.reimbursement.dto.response;

import com.expense.reimbursement.entity.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private Long managerId;
    private Long companyId;
    private boolean active;
}
