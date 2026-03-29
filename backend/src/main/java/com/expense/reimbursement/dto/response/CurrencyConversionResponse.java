package com.expense.reimbursement.dto.response;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CurrencyConversionResponse {

    private BigDecimal amount;
    private String from;
    private String to;
    private BigDecimal rate;
    private BigDecimal convertedAmount;
}
