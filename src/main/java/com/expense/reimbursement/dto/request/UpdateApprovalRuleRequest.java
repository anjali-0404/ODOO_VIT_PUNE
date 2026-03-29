package com.expense.reimbursement.dto.request;

import com.expense.reimbursement.entity.Role;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateApprovalRuleRequest {

    private String name;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private BigDecimal requiredApprovalPercentage;
    private Role autoApproveRole;
    private Boolean active;
}
