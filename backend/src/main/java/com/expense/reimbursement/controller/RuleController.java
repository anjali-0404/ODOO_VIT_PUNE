package com.expense.reimbursement.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.expense.reimbursement.dto.request.CreateApprovalRuleRequest;
import com.expense.reimbursement.dto.request.UpdateApprovalRuleRequest;
import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.ApprovalRuleResponse;
import com.expense.reimbursement.service.ApprovalRuleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RuleController {

    private final ApprovalRuleService approvalRuleService;

    @PostMapping
    public ResponseEntity<ApiResponse<ApprovalRuleResponse>> createRule(
            Principal principal,
            @Valid @RequestBody CreateApprovalRuleRequest request
    ) {
        ApprovalRuleResponse rule = approvalRuleService.createRule(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Approval rule created successfully", rule));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ApprovalRuleResponse>>> listRules(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Approval rules fetched successfully",
                approvalRuleService.listRules(principal.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApprovalRuleResponse>> updateRule(
            @PathVariable Long id,
            Principal principal,
            @Valid @RequestBody UpdateApprovalRuleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Approval rule updated successfully",
                approvalRuleService.updateRule(principal.getName(), id, request)));
    }
}
