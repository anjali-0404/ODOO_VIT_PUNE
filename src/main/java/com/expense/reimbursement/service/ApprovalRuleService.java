package com.expense.reimbursement.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expense.reimbursement.dto.request.CreateApprovalRuleRequest;
import com.expense.reimbursement.dto.request.UpdateApprovalRuleRequest;
import com.expense.reimbursement.dto.response.ApprovalRuleResponse;
import com.expense.reimbursement.entity.ApprovalRule;
import com.expense.reimbursement.entity.Role;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.exception.BadRequestException;
import com.expense.reimbursement.exception.ResourceNotFoundException;
import com.expense.reimbursement.repository.ApprovalRuleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApprovalRuleService {

    private final ApprovalRuleRepository approvalRuleRepository;
    private final UserService userService;

    @Transactional
    public ApprovalRuleResponse createRule(String adminEmail, CreateApprovalRuleRequest request) {
        User admin = userService.getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can manage rules");
        }

        if (request.getRequiredApprovalPercentage() != null
                && (request.getRequiredApprovalPercentage().compareTo(BigDecimal.ZERO) <= 0
                || request.getRequiredApprovalPercentage().compareTo(new BigDecimal("100")) > 0)) {
            throw new BadRequestException("requiredApprovalPercentage must be > 0 and <= 100");
        }
        if (request.getMinAmount() != null && request.getMaxAmount() != null
                && request.getMinAmount().compareTo(request.getMaxAmount()) > 0) {
            throw new BadRequestException("minAmount cannot be greater than maxAmount");
        }

        ApprovalRule rule = ApprovalRule.builder()
                .company(admin.getCompany())
                .name(request.getName().trim())
                .minAmount(request.getMinAmount())
                .maxAmount(request.getMaxAmount())
                .requiredApprovalPercentage(request.getRequiredApprovalPercentage())
                .autoApproveRole(request.getAutoApproveRole())
                .active(request.getActive() == null || request.getActive())
                .build();

        return toResponse(approvalRuleRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public Optional<ApprovalRule> findMatchingRule(Long companyId, BigDecimal amount) {
        List<ApprovalRule> rules = approvalRuleRepository.findByCompanyIdAndActiveTrueOrderByIdAsc(companyId);
        return rules.stream().filter(rule -> isAmountInRange(rule, amount)).findFirst();
    }

    @Transactional(readOnly = true)
    public List<ApprovalRuleResponse> listRules(String adminEmail) {
        User admin = userService.getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can list rules");
        }

        return approvalRuleRepository.findByCompanyIdOrderByIdAsc(admin.getCompany().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ApprovalRuleResponse updateRule(String adminEmail, Long ruleId, UpdateApprovalRuleRequest request) {
        User admin = userService.getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can update rules");
        }

        ApprovalRule rule = approvalRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        if (!rule.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new BadRequestException("Rule does not belong to admin company");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            rule.setName(request.getName().trim());
        }
        if (request.getMinAmount() != null) {
            rule.setMinAmount(request.getMinAmount());
        }
        if (request.getMaxAmount() != null) {
            rule.setMaxAmount(request.getMaxAmount());
        }
        if (request.getRequiredApprovalPercentage() != null) {
            if (request.getRequiredApprovalPercentage().compareTo(BigDecimal.ZERO) <= 0
                    || request.getRequiredApprovalPercentage().compareTo(new BigDecimal("100")) > 0) {
                throw new BadRequestException("requiredApprovalPercentage must be > 0 and <= 100");
            }
            rule.setRequiredApprovalPercentage(request.getRequiredApprovalPercentage());
        }
        if (request.getAutoApproveRole() != null) {
            rule.setAutoApproveRole(request.getAutoApproveRole());
        }
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }

        if (rule.getMinAmount() != null && rule.getMaxAmount() != null
                && rule.getMinAmount().compareTo(rule.getMaxAmount()) > 0) {
            throw new BadRequestException("minAmount cannot be greater than maxAmount");
        }

        ApprovalRule saved = approvalRuleRepository.save(rule);
        return toResponse(saved);
    }

    private ApprovalRuleResponse toResponse(ApprovalRule rule) {
        return ApprovalRuleResponse.builder()
                .id(rule.getId())
                .name(rule.getName())
                .minAmount(rule.getMinAmount())
                .maxAmount(rule.getMaxAmount())
                .requiredApprovalPercentage(rule.getRequiredApprovalPercentage())
                .autoApproveRole(rule.getAutoApproveRole())
                .active(rule.isActive())
                .build();
    }

    private boolean isAmountInRange(ApprovalRule rule, BigDecimal amount) {
        boolean minOk = rule.getMinAmount() == null || amount.compareTo(rule.getMinAmount()) >= 0;
        boolean maxOk = rule.getMaxAmount() == null || amount.compareTo(rule.getMaxAmount()) <= 0;
        return minOk && maxOk;
    }
}
