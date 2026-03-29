package com.expense.reimbursement.dto.request;

import com.expense.reimbursement.entity.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateApprovalRuleRequest {

    @NotBlank
    private String name;

    private BigDecimal minAmount;

    private BigDecimal maxAmount;

    private BigDecimal requiredApprovalPercentage;

    private Role autoApproveRole;

    private Boolean active;
}
