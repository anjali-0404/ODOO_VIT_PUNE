package com.expense.reimbursement.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expense.reimbursement.dto.response.ExpenseHistoryResponse;
import com.expense.reimbursement.entity.Expense;
import com.expense.reimbursement.entity.ExpenseHistory;
import com.expense.reimbursement.entity.ExpenseHistoryAction;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.repository.ExpenseHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseHistoryService {

    private final ExpenseHistoryRepository expenseHistoryRepository;

    @Transactional
    public void addHistory(Expense expense, ExpenseHistoryAction action, User performedBy, String comment) {
        ExpenseHistory history = ExpenseHistory.builder()
                .expense(expense)
                .action(action)
                .performedBy(performedBy)
                .comment(comment)
                .build();
        expenseHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<ExpenseHistoryResponse> listByExpense(Long expenseId) {
        return expenseHistoryRepository.findByExpenseIdOrderByTimestampDesc(expenseId)
                .stream()
                .map(history -> ExpenseHistoryResponse.builder()
                .id(history.getId())
                .action(history.getAction())
                .performedBy(history.getPerformedBy().getId())
                .performedByName(history.getPerformedBy().getFullName())
                .timestamp(history.getTimestamp())
                .comment(history.getComment())
                .build())
                .toList();
    }
}
