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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.expense.reimbursement.dto.request.CreateExpenseRequest;
import com.expense.reimbursement.dto.request.UpdateExpenseRequest;
import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.ExpenseHistoryResponse;
import com.expense.reimbursement.dto.response.ExpenseResponse;
import com.expense.reimbursement.dto.response.PagedResponse;
import com.expense.reimbursement.entity.ExpenseStatus;
import com.expense.reimbursement.service.ExpenseService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Expense creation, submission, listing and receipt upload APIs")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            Principal principal,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        ExpenseResponse data = expenseService.createExpense(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Expense created successfully", data));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN','FINANCE','DIRECTOR','CFO')")
    @Operation(summary = "List my expenses", description = "Returns paginated expenses for authenticated user, optionally filtered by status.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Expenses fetched", content = @Content(examples = @ExampleObject(value = "{\"success\":true,\"message\":\"My expenses fetched successfully\",\"data\":{\"items\":[],\"page\":0,\"size\":10,\"totalElements\":0,\"totalPages\":0,\"hasNext\":false,\"hasPrevious\":false}}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<ApiResponse<PagedResponse<ExpenseResponse>>> getMyExpenses(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ExpenseStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success("My expenses fetched successfully",
                expenseService.getMyExpenses(principal.getName(), page, size, status)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpenseById(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Expense fetched successfully",
                expenseService.getExpenseForUser(principal.getName(), id)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ExpenseResponse>>> getPendingExpenses(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("Pending expenses fetched successfully",
                expenseService.getPendingExpensesForApprover(principal.getName(), page, size)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(
            @PathVariable Long id,
            Principal principal,
            @Valid @RequestBody UpdateExpenseRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Expense updated successfully",
                expenseService.updateExpense(principal.getName(), id, request)));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Submit expense", description = "Moves an expense from DRAFT to PENDING and builds approval workflow chain.")
    public ResponseEntity<ApiResponse<ExpenseResponse>> submitExpense(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Expense submitted successfully",
                expenseService.submitExpense(principal.getName(), id)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<ExpenseHistoryResponse>>> expenseHistory(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Expense history fetched successfully",
                expenseService.getExpenseHistory(principal.getName(), id)));
    }

    @PostMapping("/{id}/receipt")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<String>> uploadReceipt(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Principal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success("Receipt uploaded successfully",
                expenseService.uploadReceipt(principal.getName(), id, file)));
    }
}
