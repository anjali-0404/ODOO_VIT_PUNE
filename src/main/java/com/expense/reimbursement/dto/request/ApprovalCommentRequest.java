package com.expense.reimbursement.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalCommentRequest {

    @Size(max = 1000)
    private String comment;
}
