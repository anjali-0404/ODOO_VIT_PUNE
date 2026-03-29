package com.expense.reimbursement.controller;

import java.security.Principal;

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

import com.expense.reimbursement.dto.request.CreateUserRequest;
import com.expense.reimbursement.dto.request.UpdateUserRoleRequest;
import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.PagedResponse;
import com.expense.reimbursement.dto.response.UserResponse;
import com.expense.reimbursement.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(Principal principal, @Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", user));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> listUsers(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully",
                userService.listUsers(principal.getName(), page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", userService.getUserDetails(principal.getName(), id)));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable Long id,
            Principal principal,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully",
                userService.updateUserRole(principal.getName(), id, request.getRole())));
    }
}
