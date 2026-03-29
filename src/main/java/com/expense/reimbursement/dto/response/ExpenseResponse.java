package com.expense.reimbursement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.expense.reimbursement.entity.ExpenseStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExpenseResponse {

    private Long id;
    private Long employeeId;
    private BigDecimal amount;
    private String currency;
    private String category;
    private String description;
    private LocalDate expenseDate;
    private ExpenseStatus status;
    private Integer currentStep;
    private LocalDateTime submittedAt;
    private String receiptUrl;
    private List<ApprovalResponse> approvals;
}
