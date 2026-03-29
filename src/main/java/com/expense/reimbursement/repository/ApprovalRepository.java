package com.expense.reimbursement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.expense.reimbursement.entity.Approval;
import com.expense.reimbursement.entity.ApprovalDecision;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    List<Approval> findByExpenseIdOrderByStepOrderAsc(Long expenseId);

    Optional<Approval> findFirstByExpenseIdAndDecisionOrderByStepOrderAsc(Long expenseId, ApprovalDecision decision);
}
