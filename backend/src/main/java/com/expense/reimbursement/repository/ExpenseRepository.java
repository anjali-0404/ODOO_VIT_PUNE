package com.expense.reimbursement.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.expense.reimbursement.entity.Expense;
import com.expense.reimbursement.entity.ExpenseStatus;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @EntityGraph(attributePaths = {"employee", "employee.manager", "company", "approvals", "approvals.approver"})
    Page<Expense> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId, Pageable pageable);

    List<Expense> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    @EntityGraph(attributePaths = {"employee", "employee.manager", "company", "approvals", "approvals.approver"})
    Page<Expense> findByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, ExpenseStatus status, Pageable pageable);
}
