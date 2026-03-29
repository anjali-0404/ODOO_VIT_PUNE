package com.expense.reimbursement.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.expense.reimbursement.dto.response.OcrScanResponse;

@Service
public class OcrService {

    public OcrScanResponse scanReceipt(MultipartFile file) {
        // Mock OCR output for hackathon mode.
        return OcrScanResponse.builder()
                .amount("1234.56")
                .date("2026-03-29")
                .description("Mock OCR extracted data from " + file.getOriginalFilename())
                .build();
    }
}
