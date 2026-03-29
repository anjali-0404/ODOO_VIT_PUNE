package com.expense.reimbursement.dto.request;

import com.expense.reimbursement.entity.ApprovalActionType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalActionRequest {

    @NotNull
    private Long approverId;

    @NotNull
    private ApprovalActionType action;

    private String comment;
}
