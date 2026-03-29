package com.expense.reimbursement.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.expense.reimbursement.dto.request.ApprovalCommentRequest;
import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.ApprovalProgressResponse;
import com.expense.reimbursement.dto.response.ApprovalResponse;
import com.expense.reimbursement.dto.response.ExpenseResponse;
import com.expense.reimbursement.dto.response.PagedResponse;
import com.expense.reimbursement.entity.ApprovalDecision;
import com.expense.reimbursement.service.ApprovalService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@Tag(name = "Approvals", description = "Approval actions and workflow visibility APIs")
public class ApprovalController {

    private final ApprovalService approvalService;

    @PutMapping("/{expenseId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> approveExpense(
            @PathVariable Long expenseId,
            Principal principal,
            @Valid @RequestBody(required = false) ApprovalCommentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Expense approved successfully",
                approvalService.approveExpense(principal.getName(), expenseId, request)));
    }

    @PutMapping("/{expenseId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> rejectExpense(
            @PathVariable Long expenseId,
            Principal principal,
            @Valid @RequestBody(required = false) ApprovalCommentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Expense rejected successfully",
                approvalService.rejectExpense(principal.getName(), expenseId, request)));
    }

    @GetMapping("/{expenseId}/progress")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    @Operation(summary = "Get approval progress", description = "Returns approval percentage and explicit rule evaluation state.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Progress fetched", content = @Content(examples = @ExampleObject(value = "{\"success\":true,\"message\":\"Approval progress fetched successfully\",\"data\":{\"totalApprovers\":3,\"approvedCount\":1,\"percentageApproved\":33.33,\"approved\":false,\"allApprovalsCompleted\":false,\"ruleMatched\":true,\"ruleBasedApproved\":false,\"specialRoleApproved\":false,\"requiredApprovalPercentage\":66.67,\"requiredSpecialRole\":\"DIRECTOR\",\"approvalReason\":\"PENDING_MORE_APPROVALS\"}}")))
    })
    public ResponseEntity<ApiResponse<ApprovalProgressResponse>> getApprovalProgress(
            @PathVariable Long expenseId,
            Principal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success("Approval progress fetched successfully",
                approvalService.getApprovalProgress(principal.getName(), expenseId)));
    }

    @GetMapping("/{expenseId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<ApprovalResponse>>> getApprovalsByExpense(
            @PathVariable Long expenseId,
            Principal principal,
            @RequestParam(required = false) ApprovalDecision status
    ) {
        return ResponseEntity.ok(ApiResponse.success("Approvals fetched successfully",
                approvalService.getApprovalsForExpense(principal.getName(), expenseId, status)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ExpenseResponse>>> getPendingApprovals(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("Pending approvals fetched successfully",
                approvalService.getPendingApprovals(principal.getName(), page, size)));
    }
}
