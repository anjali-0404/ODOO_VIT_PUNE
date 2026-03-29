package com.expense.reimbursement.controller;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.CurrencyConversionResponse;
import com.expense.reimbursement.service.CurrencyService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/convert")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<CurrencyConversionResponse>> convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam BigDecimal amount
    ) {
        return ResponseEntity.ok(ApiResponse.success("Currency converted successfully",
                currencyService.convert(from, to, amount)));
    }
}
