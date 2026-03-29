package com.expense.reimbursement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expense.reimbursement.dto.request.CreateUserRequest;
import com.expense.reimbursement.dto.request.SignupRequest;
import com.expense.reimbursement.dto.response.PagedResponse;
import com.expense.reimbursement.dto.response.UserResponse;
import com.expense.reimbursement.entity.Company;
import com.expense.reimbursement.entity.Role;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.exception.BadRequestException;
import com.expense.reimbursement.exception.ResourceNotFoundException;
import com.expense.reimbursement.repository.CompanyRepository;
import com.expense.reimbursement.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User signupCompanyAndAdmin(SignupRequest request) {
        if (companyRepository.findByNameIgnoreCase(request.getCompanyName()).isPresent()) {
            throw new BadRequestException("Company already exists");
        }
        if (userRepository.findByEmailIgnoreCase(request.getAdminEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        Company company = Company.builder()
                .name(request.getCompanyName().trim())
                .build();
        company = companyRepository.save(company);

        User admin = User.builder()
                .company(company)
                .fullName(request.getAdminName().trim())
                .email(request.getAdminEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .role(Role.ADMIN)
                .active(true)
                .build();

        return userRepository.save(admin);
    }

    @Transactional
    public UserResponse createUser(String adminEmail, CreateUserRequest request) {
        User admin = getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can create users");
        }
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        User manager = null;
        if (request.getManagerId() != null) {
            manager = getUserOrThrow(request.getManagerId());
            if (!manager.getCompany().getId().equals(admin.getCompany().getId())) {
                throw new BadRequestException("Manager must belong to the same company");
            }
            if (manager.getRole() != Role.MANAGER && manager.getRole() != Role.ADMIN) {
                throw new BadRequestException("Manager must have MANAGER or ADMIN role");
            }
        }

        User user = User.builder()
                .company(admin.getCompany())
                .manager(manager)
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> listUsers(String adminEmail, int page, int size) {
        User admin = getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can list users");
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<User> users = userRepository.findByCompanyIdOrderByIdAsc(admin.getCompany().getId(), pageable);

        return PagedResponse.<UserResponse>builder()
                .items(users.getContent()
                        .stream()
                        .map(this::toResponse)
                        .toList())
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .hasNext(users.hasNext())
                .hasPrevious(users.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserDetails(String adminEmail, Long userId) {
        User admin = getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can view user details");
        }
        User user = getUserOrThrow(userId);
        if (!user.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new BadRequestException("User not in admin company");
        }
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateUserRole(String adminEmail, Long userId, Role role) {
        User admin = getUserByEmailOrThrow(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN can update roles");
        }

        User user = getUserOrThrow(userId);
        if (!user.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new BadRequestException("User not in admin company");
        }
        if (user.getId().equals(admin.getId()) && role != Role.ADMIN) {
            throw new BadRequestException("Admin cannot demote self");
        }

        user.setRole(role);
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public User getUserByEmailOrThrow(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public User getFirstUserByCompanyAndRoleOrThrow(Long companyId, Role role) {
        return userRepository.findByCompanyIdAndRole(companyId, role)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No " + role + " user found for company: " + companyId));
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .managerId(user.getManager() != null ? user.getManager().getId() : null)
                .companyId(user.getCompany().getId())
                .active(user.isActive())
                .build();
    }
}
