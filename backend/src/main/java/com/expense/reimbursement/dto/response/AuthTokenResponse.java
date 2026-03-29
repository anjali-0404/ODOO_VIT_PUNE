package com.expense.reimbursement.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthTokenResponse {

    private String accessToken;
    private String tokenType;
    private Long expiresIn;
}
