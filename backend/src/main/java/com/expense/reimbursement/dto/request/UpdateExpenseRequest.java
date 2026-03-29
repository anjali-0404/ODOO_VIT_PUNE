package com.expense.reimbursement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdateExpenseRequest {

    @DecimalMin(value = "0.01")
    private BigDecimal amount;
    private String currency;
    private String category;
    private String description;
    private LocalDate expenseDate;
}
