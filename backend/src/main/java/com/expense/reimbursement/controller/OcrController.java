package com.expense.reimbursement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.expense.reimbursement.dto.response.ApiResponse;
import com.expense.reimbursement.dto.response.OcrScanResponse;
import com.expense.reimbursement.service.OcrService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<OcrScanResponse>> scanReceipt(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("OCR scan completed successfully", ocrService.scanReceipt(file)));
    }
}
