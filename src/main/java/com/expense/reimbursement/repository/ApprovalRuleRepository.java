package com.expense.reimbursement.repository;

import com.expense.reimbursement.entity.ApprovalRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRuleRepository extends JpaRepository<ApprovalRule, Long> {

    List<ApprovalRule> findByCompanyIdAndActiveTrueOrderByIdAsc(Long companyId);

    List<ApprovalRule> findByCompanyIdOrderByIdAsc(Long companyId);
}
