package com.expense.reimbursement.dto.response;

import com.expense.reimbursement.entity.Role;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ApprovalRuleResponse {

    private Long id;
    private String name;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private BigDecimal requiredApprovalPercentage;
    private Role autoApproveRole;
    private boolean active;
}
