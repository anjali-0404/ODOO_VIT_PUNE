package com.expense.reimbursement.controller;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.expense.reimbursement.dto.request.LoginRequest;
import com.expense.reimbursement.dto.request.SignupRequest;
import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.AuthTokenResponse;
import com.expense.reimbursement.dto.response.UserResponse;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.security.JwtService;
import com.expense.reimbursement.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
        User admin = userService.signupCompanyAndAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Company and admin created successfully", userService.toResponse(admin)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userService.getUserByEmailOrThrow(request.getEmail());
        String token = jwtService.generateToken(user);
        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(Principal principal) {
        User user = userService.getUserByEmailOrThrow(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Current user fetched", userService.toResponse(user)));
    }
}
