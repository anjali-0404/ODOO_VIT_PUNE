package com.expense.reimbursement.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expense.reimbursement.dto.response.NotificationResponse;
import com.expense.reimbursement.entity.Notification;
import com.expense.reimbursement.entity.User;
import com.expense.reimbursement.exception.ResourceNotFoundException;
import com.expense.reimbursement.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @Transactional
    public void notifyUser(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(String userEmail) {
        User user = userService.getUserByEmailOrThrow(userEmail);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(notification -> NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build())
                .toList();
    }

    @Transactional
    public NotificationResponse markAsRead(String userEmail, Long notificationId) {
        User user = userService.getUserByEmailOrThrow(userEmail);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.builder()
                .id(saved.getId())
                .message(saved.getMessage())
                .read(saved.isRead())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
