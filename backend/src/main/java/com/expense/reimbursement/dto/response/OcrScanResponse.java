package com.expense.reimbursement.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OcrScanResponse {

    private String amount;
    private String date;
    private String description;
}
