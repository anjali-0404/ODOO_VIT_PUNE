package com.expense.reimbursement.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.NotificationResponse;
import com.expense.reimbursement.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification inbox APIs")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully",
                notificationService.getNotifications(principal.getName())));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    @Operation(summary = "Mark notification as read", description = "Marks a single notification as read for the current user.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification marked as read", content = @Content(examples = @ExampleObject(value = "{\"success\":true,\"message\":\"Notification marked as read\",\"data\":{\"id\":10,\"message\":\"Expense approved\",\"read\":true,\"createdAt\":\"2026-03-29T11:00:00\"}}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Notification not found")
    })
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read",
                notificationService.markAsRead(principal.getName(), id)));
    }
}
