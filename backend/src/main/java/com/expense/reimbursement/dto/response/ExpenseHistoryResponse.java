package com.expense.reimbursement.dto.response;

import java.time.LocalDateTime;

import com.expense.reimbursement.entity.ExpenseHistoryAction;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExpenseHistoryResponse {

    private Long id;
    private ExpenseHistoryAction action;
    private Long performedBy;
    private String performedByName;
    private LocalDateTime timestamp;
    private String comment;
}
