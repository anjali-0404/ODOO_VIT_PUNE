package com.expense.reimbursement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.expense.reimbursement.entity.Role;
import com.expense.reimbursement.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByCompanyIdAndRole(Long companyId, Role role);

    List<User> findByCompanyIdOrderByIdAsc(Long companyId);

    Page<User> findByCompanyIdOrderByIdAsc(Long companyId, Pageable pageable);
}
