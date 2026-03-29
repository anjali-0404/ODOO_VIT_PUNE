package com.expense.reimbursement.dto.response;

import java.math.BigDecimal;

import com.expense.reimbursement.entity.Role;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApprovalProgressResponse {

    private int totalApprovers;
    private int approvedCount;
    private double percentageApproved;
    private boolean approved;
    private boolean allApprovalsCompleted;
    private boolean ruleMatched;
    private boolean ruleBasedApproved;
    private boolean specialRoleApproved;
    private BigDecimal requiredApprovalPercentage;
    private Role requiredSpecialRole;
    private String approvalReason;
}
