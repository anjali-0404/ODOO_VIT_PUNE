package com.expense.reimbursement.dto.response;

import java.time.LocalDateTime;

import com.expense.reimbursement.entity.ApprovalDecision;
import com.expense.reimbursement.entity.Role;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApprovalResponse {

    private Long id;
    private Integer stepOrder;
    private boolean currentStep;
    private Role requiredRole;
    private Long approverId;
    private ApprovalDecision decision;
    private String comment;
    private LocalDateTime decisionAt;
}
