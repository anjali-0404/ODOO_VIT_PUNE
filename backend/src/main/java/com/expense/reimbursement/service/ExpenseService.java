package com.expense.reimbursement.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.expense.reimbursement.dto.request.CreateExpenseRequest;
import com.expense.reimbursement.dto.request.UpdateExpenseRequest;
import com.expense.reimbursement.dto.response.ApprovalResponse;
import com.expense.reimbursement.dto.response.ExpenseHistoryResponse;
import com.expense.reimbursement.dto.response.ExpenseResponse;
import com.expense.reimbursement.dto.response.PagedResponse;
import com.expense.reimbursement.entity.Approval;
import com.expense.reimbursement.entity.ApprovalDecision;
import com.expense.reimbursement.entity.Expense;
import com.expense.reimbursement.entity.ExpenseHistoryAction;
import com.expense.reimbursement.entity.ExpenseStatus;
import com.expense.reimbursement.entity.Role;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.exception.BadRequestException;
import com.expense.reimbursement.exception.ResourceNotFoundException;
import com.expense.reimbursement.repository.ExpenseRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private static final long MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_RECEIPT_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg"
    );

    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final ExpenseHistoryService expenseHistoryService;
    private final NotificationService notificationService;

    @Transactional
    public ExpenseResponse createExpense(String authenticatedEmail, CreateExpenseRequest request) {
        User employee = userService.getUserByEmailOrThrow(authenticatedEmail);

        Expense expense = Expense.builder()
                .company(employee.getCompany())
                .employee(employee)
                .amount(request.getAmount())
                .currency(request.getCurrency().trim().toUpperCase())
                .category(request.getCategory().trim())
                .description(request.getDescription().trim())
                .expenseDate(request.getExpenseDate())
                .status(ExpenseStatus.DRAFT)
                .currentStep(0)
                .build();

        Expense saved = expenseRepository.save(expense);
        expenseHistoryService.addHistory(saved, ExpenseHistoryAction.CREATED, employee, "Expense saved as draft");
        return toResponse(saved);
    }

    @Transactional
    public ExpenseResponse submitExpense(String authenticatedEmail, Long expenseId) {
        User employee = userService.getUserByEmailOrThrow(authenticatedEmail);
        Expense expense = getExpenseOrThrow(expenseId);

        if (!expense.getEmployee().getId().equals(employee.getId())) {
            throw new BadRequestException("Business rule violation: only expense owner can submit this expense");
        }
        if (expense.getStatus() != ExpenseStatus.DRAFT) {
            throw new BadRequestException("Business rule violation: only DRAFT expenses can be submitted");
        }
        if (employee.getRole() == Role.EMPLOYEE && employee.getManager() == null) {
            throw new BadRequestException("Business rule violation: employee must have an assigned manager before submission");
        }

        // Rebuild chain on submit to avoid stale/incomplete steps from previous draft edits.
        expense.getApprovals().clear();
        buildApprovalChain(expense, employee);

        Optional<Approval> firstStep = getCurrentStepApproval(expense);
        if (firstStep.isEmpty()) {
            throw new BadRequestException("Business rule violation: approval workflow could not be initialized");
        }

        expense.setStatus(ExpenseStatus.PENDING);
        expense.setSubmittedAt(LocalDateTime.now());
        expense.setCurrentStep(firstStep.get().getStepOrder());

        Expense saved = expenseRepository.save(expense);
        expenseHistoryService.addHistory(saved, ExpenseHistoryAction.SUBMITTED, employee, "Expense submitted for approval");
        getCurrentStepApproval(saved)
                .map(Approval::getApprover)
                .ifPresent(approver -> notificationService.notifyUser(approver,
                "New expense submitted for your approval. Expense ID: " + saved.getId()));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExpenseResponse> getMyExpenses(String authenticatedEmail, int page, int size, ExpenseStatus status) {
        User employee = userService.getUserByEmailOrThrow(authenticatedEmail);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<Expense> expenses = expenseRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId(), pageable);
        List<ExpenseResponse> items = expenses.getContent().stream()
                .filter(expense -> status == null || expense.getStatus() == status)
                .map(this::toResponse)
                .toList();

        return PagedResponse.<ExpenseResponse>builder()
                .items(items)
                .page(expenses.getNumber())
                .size(expenses.getSize())
                .totalElements(expenses.getTotalElements())
                .totalPages(expenses.getTotalPages())
                .hasNext(expenses.hasNext())
                .hasPrevious(expenses.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseForUser(String authenticatedEmail, Long expenseId) {
        User requester = userService.getUserByEmailOrThrow(authenticatedEmail);
        return toResponse(getAuthorizedExpenseOrThrow(requester, expenseId));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExpenseResponse> getPendingExpensesForApprover(String authenticatedEmail, int page, int size) {
        User approver = userService.getUserByEmailOrThrow(authenticatedEmail);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Expense> expenses = expenseRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(
                approver.getCompany().getId(),
                ExpenseStatus.PENDING,
                pageable
        );

        List<ExpenseResponse> filtered = expenses.getContent().stream()
                .filter(expense -> getCurrentStepApproval(expense)
                .map(approval -> canActOnStep(approver, approval, expense))
                .orElse(false))
                .map(this::toResponse)
                .toList();

        return PagedResponse.<ExpenseResponse>builder()
                .items(filtered)
                .page(expenses.getNumber())
                .size(expenses.getSize())
                .totalElements(expenses.getTotalElements())
                .totalPages(expenses.getTotalPages())
                .hasNext(expenses.hasNext())
                .hasPrevious(expenses.hasPrevious())
                .build();
    }

    @Transactional
    public ExpenseResponse updateExpense(String authenticatedEmail, Long expenseId, UpdateExpenseRequest request) {
        User requester = userService.getUserByEmailOrThrow(authenticatedEmail);
        Expense expense = getExpenseOrThrow(expenseId);

        if (!expense.getEmployee().getId().equals(requester.getId())) {
            throw new BadRequestException("Business rule violation: only expense owner can edit this expense");
        }
        if (expense.getStatus() != ExpenseStatus.DRAFT) {
            throw new BadRequestException("Business rule violation: expense is locked and can only be edited in DRAFT status");
        }

        if (request.getAmount() != null) {
            expense.setAmount(request.getAmount());
        }
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            expense.setCurrency(request.getCurrency().trim().toUpperCase());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            expense.setCategory(request.getCategory().trim());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            expense.setDescription(request.getDescription().trim());
        }
        if (request.getExpenseDate() != null) {
            expense.setExpenseDate(request.getExpenseDate());
        }

        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public String uploadReceipt(String authenticatedEmail, Long expenseId, MultipartFile file) {
        User requester = userService.getUserByEmailOrThrow(authenticatedEmail);
        Expense expense = getExpenseOrThrow(expenseId);

        if (!expense.getEmployee().getId().equals(requester.getId())) {
            throw new BadRequestException("Business rule violation: only expense owner can upload receipt");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Receipt file is required");
        }
        validateReceiptFile(file);

        try {
            Path uploadDir = Paths.get("uploads", "receipts");
            Files.createDirectories(uploadDir);
            String originalName = file.getOriginalFilename() == null ? "receipt" : Paths.get(file.getOriginalFilename()).getFileName().toString();
            String safeName = UUID.randomUUID() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path target = uploadDir.resolve(safeName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            expense.setReceiptUrl(target.toString().replace('\\', '/'));
            expenseRepository.save(expense);
            return expense.getReceiptUrl();
        } catch (IOException ex) {
            throw new BadRequestException("Failed to upload receipt: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ExpenseHistoryResponse> getExpenseHistory(String authenticatedEmail, Long expenseId) {
        User requester = userService.getUserByEmailOrThrow(authenticatedEmail);
        getAuthorizedExpenseOrThrow(requester, expenseId);
        return expenseHistoryService.listByExpense(expenseId);
    }

    @Transactional(readOnly = true)
    public Expense getExpenseOrThrow(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + id));
    }

    @Transactional
    public void save(Expense expense) {
        expenseRepository.save(expense);
    }

    public ExpenseResponse toResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .employeeId(expense.getEmployee().getId())
                .amount(expense.getAmount())
                .currency(expense.getCurrency())
                .category(expense.getCategory())
                .description(expense.getDescription())
                .expenseDate(expense.getExpenseDate())
                .status(expense.getStatus())
                .currentStep(expense.getCurrentStep())
                .submittedAt(expense.getSubmittedAt())
                .receiptUrl(expense.getReceiptUrl())
                .approvals(expense.getApprovals().stream()
                        .sorted(Comparator.comparing(Approval::getStepOrder))
                        .map(approval -> ApprovalResponse.builder()
                        .id(approval.getId())
                        .stepOrder(approval.getStepOrder())
                        .currentStep(approval.isCurrentStep())
                        .requiredRole(approval.getRequiredRole())
                        .approverId(approval.getApprover() != null ? approval.getApprover().getId() : null)
                        .decision(approval.getDecision())
                        .comment(approval.getComment())
                        .decisionAt(approval.getDecisionAt())
                        .build())
                        .toList())
                .build();
    }

    private PagedResponse<ExpenseResponse> toPagedResponse(Page<Expense> page) {
        return PagedResponse.<ExpenseResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }

    private void buildApprovalChain(Expense expense, User employee) {
        User financeApprover = getRequiredApproverOrValidationError(expense.getCompany().getId(), Role.FINANCE);
        User directorApprover = getRequiredApproverOrValidationError(expense.getCompany().getId(), Role.DIRECTOR);

        int stepOrder = 1;

        if (employee.getManager() != null) {
            expense.getApprovals().add(Approval.builder()
                    .expense(expense)
                    .approver(employee.getManager())
                    .requiredRole(Role.MANAGER)
                    .stepOrder(stepOrder++)
                    .isCurrentStep(false)
                    .decision(ApprovalDecision.PENDING)
                    .build());
        }

        expense.getApprovals().add(Approval.builder()
                .expense(expense)
                .approver(financeApprover)
                .requiredRole(Role.FINANCE)
                .stepOrder(stepOrder++)
                .isCurrentStep(false)
                .decision(ApprovalDecision.PENDING)
                .build());

        expense.getApprovals().add(Approval.builder()
                .expense(expense)
                .approver(directorApprover)
                .requiredRole(Role.DIRECTOR)
                .stepOrder(stepOrder)
                .isCurrentStep(false)
                .decision(ApprovalDecision.PENDING)
                .build());

        expense.getApprovals().stream()
                .min(Comparator.comparing(Approval::getStepOrder))
                .ifPresent(approval -> approval.setCurrentStep(true));
    }

    private User getRequiredApproverOrValidationError(Long companyId, Role role) {
        try {
            return userService.getFirstUserByCompanyAndRoleOrThrow(companyId, role);
        } catch (ResourceNotFoundException ex) {
            throw new BadRequestException("Business rule violation: configure at least one " + role + " approver before submission");
        }
    }

    private void validateReceiptFile(MultipartFile file) {
        if (file.getSize() > MAX_RECEIPT_SIZE_BYTES) {
            throw new BadRequestException("Receipt file must be <= 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_RECEIPT_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Unsupported receipt file type. Allowed: PDF, PNG, JPG, JPEG");
        }
    }

    public Optional<Approval> getCurrentStepApproval(Expense expense) {
        return expense.getApprovals().stream()
                .filter(a -> a.getDecision() == ApprovalDecision.PENDING)
                .filter(Approval::isCurrentStep)
                .min(Comparator.comparing(Approval::getStepOrder));
    }

    public boolean canActOnStep(User approver, Approval approval, Expense expense) {
        if (!approval.isCurrentStep() || approval.getDecision() != ApprovalDecision.PENDING) {
            return false;
        }
        if (approver.getRole() == Role.ADMIN) {
            return true;
        }
        if (approval.getApprover() != null && approval.getApprover().getId().equals(approver.getId())) {
            return true;
        }
        if (approval.getRequiredRole() == Role.MANAGER) {
            return approver.getRole() == Role.MANAGER
                    && expense.getEmployee().getManager() != null
                    && expense.getEmployee().getManager().getId().equals(approver.getId());
        }
        return approver.getRole() == approval.getRequiredRole();
    }

    public void moveToNextStepOrApprove(Expense expense) {
        Optional<Approval> currentStep = getCurrentStepApproval(expense);
        currentStep.ifPresent(step -> step.setCurrentStep(false));

        Optional<Approval> nextStep = expense.getApprovals().stream()
                .filter(a -> a.getDecision() == ApprovalDecision.PENDING)
                .min(Comparator.comparing(Approval::getStepOrder));

        if (nextStep.isEmpty()) {
            expense.setStatus(ExpenseStatus.APPROVED);
            expense.setCurrentStep(0);
            return;
        }

        nextStep.get().setCurrentStep(true);
        expense.setCurrentStep(nextStep.get().getStepOrder());
    }

    private Expense getAuthorizedExpenseOrThrow(User requester, Long expenseId) {
        Expense expense = getExpenseOrThrow(expenseId);
        if (!requester.getCompany().getId().equals(expense.getCompany().getId())) {
            throw new BadRequestException("Business rule violation: expense belongs to a different company");
        }

        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isOwner = expense.getEmployee().getId().equals(requester.getId());
        boolean isManager = expense.getEmployee().getManager() != null
                && expense.getEmployee().getManager().getId().equals(requester.getId());

        if (!isAdmin && !isOwner && !isManager) {
            throw new BadRequestException("Business rule violation: requester is not allowed to access this expense");
        }

        return expense;
    }
}
