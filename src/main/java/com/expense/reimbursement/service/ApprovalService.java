package com.expense.reimbursement.service;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expense.reimbursement.dto.request.ApprovalCommentRequest;
import com.expense.reimbursement.dto.response.ApprovalProgressResponse;
import com.expense.reimbursement.dto.response.ApprovalResponse;
import com.expense.reimbursement.dto.response.ExpenseResponse;
import com.expense.reimbursement.dto.response.PagedResponse;
import com.expense.reimbursement.entity.Approval;
import com.expense.reimbursement.entity.ApprovalActionType;
import com.expense.reimbursement.entity.ApprovalDecision;
import com.expense.reimbursement.entity.ApprovalRule;
import com.expense.reimbursement.entity.Expense;
import com.expense.reimbursement.entity.ExpenseHistoryAction;
import com.expense.reimbursement.entity.ExpenseStatus;
import com.expense.reimbursement.entity.Role;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.exception.BadRequestException;
import com.expense.reimbursement.repository.ApprovalRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ExpenseService expenseService;
    private final UserService userService;
    private final ApprovalRuleService approvalRuleService;
    private final ApprovalRepository approvalRepository;
    private final ExpenseHistoryService expenseHistoryService;
    private final NotificationService notificationService;

    @Transactional
    public ExpenseResponse approveExpense(String approverEmail, Long expenseId, ApprovalCommentRequest request) {
        return processAction(approverEmail, expenseId, ApprovalActionType.APPROVE, request != null ? request.getComment() : null);
    }

    @Transactional
    public ExpenseResponse rejectExpense(String approverEmail, Long expenseId, ApprovalCommentRequest request) {
        return processAction(approverEmail, expenseId, ApprovalActionType.REJECT, request != null ? request.getComment() : null);
    }

    @Transactional(readOnly = true)
    public List<ApprovalResponse> getApprovalsForExpense(String requesterEmail, Long expenseId, ApprovalDecision status) {
        User requester = userService.getUserByEmailOrThrow(requesterEmail);
        Expense expense = expenseService.getExpenseOrThrow(expenseId);
        if (!requester.getCompany().getId().equals(expense.getCompany().getId())) {
            throw new BadRequestException("Business rule violation: requester and expense must belong to same company");
        }

        return approvalRepository.findByExpenseIdOrderByStepOrderAsc(expenseId)
                .stream()
                .filter(approval -> status == null || approval.getDecision() == status)
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
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExpenseResponse> getPendingApprovals(String approverEmail, int page, int size) {
        return expenseService.getPendingExpensesForApprover(approverEmail, page, size);
    }

    @Transactional(readOnly = true)
    public ApprovalProgressResponse getApprovalProgress(String requesterEmail, Long expenseId) {
        User requester = userService.getUserByEmailOrThrow(requesterEmail);
        Expense expense = expenseService.getExpenseOrThrow(expenseId);
        if (!requester.getCompany().getId().equals(expense.getCompany().getId())) {
            throw new BadRequestException("Business rule violation: requester and expense must belong to same company");
        }

        return calculateProgress(expense);
    }

    private ExpenseResponse processAction(String approverEmail, Long expenseId, ApprovalActionType action, String comment) {
        User approver = userService.getUserByEmailOrThrow(approverEmail);
        Expense expense = expenseService.getExpenseOrThrow(expenseId);

        if (!approver.getCompany().getId().equals(expense.getCompany().getId())) {
            throw new BadRequestException("Business rule violation: approver and expense must belong to same company");
        }
        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new BadRequestException("Business rule violation: only PENDING expenses can be approved or rejected");
        }

        boolean hasAlreadyDecided = expense.getApprovals().stream()
                .anyMatch(a -> a.getDecision() != ApprovalDecision.PENDING
                && a.getApprover() != null
                && a.getApprover().getId().equals(approver.getId()));
        if (hasAlreadyDecided) {
            throw new BadRequestException("Business rule violation: approver has already acted on this expense");
        }

        Approval currentApproval = expenseService.getCurrentStepApproval(expense)
                .orElseThrow(() -> new BadRequestException("Business rule violation: no active approval step found"));

        if (!expenseService.canActOnStep(approver, currentApproval, expense)) {
            throw new BadRequestException("Business rule violation: requester is not the current step approver");
        }

        if (action == ApprovalActionType.REJECT) {
            applyRejection(expense, currentApproval, approver, comment);
            expenseService.save(expense);
            expenseHistoryService.addHistory(expense, ExpenseHistoryAction.REJECTED, approver, comment);
            notificationService.notifyUser(expense.getEmployee(), "Your expense #" + expense.getId() + " was rejected");
            return expenseService.toResponse(expense);
        }

        applyApproval(expense, currentApproval, approver, comment);
        expenseService.save(expense);

        if (expense.getStatus() == ExpenseStatus.APPROVED) {
            expenseHistoryService.addHistory(expense, ExpenseHistoryAction.APPROVED, approver, comment);
            notificationService.notifyUser(expense.getEmployee(), "Your expense #" + expense.getId() + " was approved");
        } else {
            expenseService.getCurrentStepApproval(expense).ifPresent(next -> {
                if (next.getApprover() != null) {
                    notificationService.notifyUser(next.getApprover(), "Expense #" + expense.getId() + " is waiting for your approval");
                }
            });
        }

        return expenseService.toResponse(expense);
    }

    private void applyRejection(Expense expense, Approval approval, User approver, String comment) {
        approval.setApprover(approver);
        approval.setDecision(ApprovalDecision.REJECTED);
        approval.setComment(comment);
        approval.setDecisionAt(LocalDateTime.now());
        approval.setCurrentStep(false);
        expense.setStatus(ExpenseStatus.REJECTED);
        expense.setCurrentStep(null);
    }

    private void applyApproval(Expense expense, Approval approval, User approver, String comment) {
        approval.setApprover(approver);
        approval.setDecision(ApprovalDecision.APPROVED);
        approval.setComment(comment);
        approval.setDecisionAt(LocalDateTime.now());
        approval.setCurrentStep(false);

        ApprovalProgressResponse progress = calculateProgress(expense);

        if (progress.isApproved()) {
            expense.setStatus(ExpenseStatus.APPROVED);
            expense.setCurrentStep(null);
            expense.getApprovals().stream()
                    .filter(a -> a.getDecision() == ApprovalDecision.PENDING)
                    .forEach(a -> a.setCurrentStep(false));
            return;
        }

        expenseService.moveToNextStepOrApprove(expense);
    }

    private ApprovalProgressResponse calculateProgress(Expense expense) {
        int total = expense.getApprovals().size();
        if (total == 0) {
            return ApprovalProgressResponse.builder()
                    .totalApprovers(0)
                    .approvedCount(0)
                    .percentageApproved(0.0)
                    .approved(false)
                    .specialRoleApproved(false)
                    .build();
        }

        int approvedCount = (int) expense.getApprovals().stream()
                .filter(a -> a.getDecision() == ApprovalDecision.APPROVED)
                .count();
        double percentageRaw = (approvedCount * 100.0) / total;
        double percentage = BigDecimal.valueOf(percentageRaw).setScale(2, RoundingMode.HALF_UP).doubleValue();

        Optional<ApprovalRule> ruleOpt = approvalRuleService.findMatchingRule(expense.getCompany().getId(), expense.getAmount());
        boolean ruleMatched = ruleOpt.isPresent();
        boolean specialRoleApproved = false;
        boolean ruleBasedApproved = false;
        BigDecimal requiredApprovalPercentage = null;
        Role requiredSpecialRole = null;

        if (ruleOpt.isPresent()) {
            ApprovalRule rule = ruleOpt.get();
            requiredApprovalPercentage = rule.getRequiredApprovalPercentage();
            requiredSpecialRole = rule.getAutoApproveRole();
            if (rule.getAutoApproveRole() != null) {
                specialRoleApproved = expense.getApprovals().stream()
                        .anyMatch(a -> a.getRequiredRole() == rule.getAutoApproveRole()
                        && a.getDecision() == ApprovalDecision.APPROVED);
            }
            if (rule.getRequiredApprovalPercentage() != null) {
                ruleBasedApproved = percentage >= rule.getRequiredApprovalPercentage().doubleValue();
            }
        }

        boolean allApproved = total > 0 && approvedCount == total;
        boolean isApproved = allApproved || ruleBasedApproved || specialRoleApproved;
        String approvalReason = allApproved ? "ALL_APPROVALS_COMPLETED"
                : (ruleBasedApproved ? "PERCENTAGE_RULE_SATISFIED"
                        : (specialRoleApproved ? "SPECIAL_ROLE_RULE_SATISFIED" : "PENDING_MORE_APPROVALS"));

        return ApprovalProgressResponse.builder()
                .totalApprovers(total)
                .approvedCount(approvedCount)
                .percentageApproved(percentage)
                .approved(isApproved)
                .allApprovalsCompleted(allApproved)
                .ruleMatched(ruleMatched)
                .ruleBasedApproved(ruleBasedApproved)
                .specialRoleApproved(specialRoleApproved)
                .requiredApprovalPercentage(requiredApprovalPercentage)
                .requiredSpecialRole(requiredSpecialRole)
                .approvalReason(approvalReason)
                .build();
    }
}
