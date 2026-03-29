package com.expense.reimbursement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.expense.reimbursement.entity.ExpenseHistory;

public interface ExpenseHistoryRepository extends JpaRepository<ExpenseHistory, Long> {

    List<ExpenseHistory> findByExpenseIdOrderByTimestampDesc(Long expenseId);
}
