package com.expense.reimbursement.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.expense.reimbursement.dto.response.CurrencyConversionResponse;
import com.expense.reimbursement.exception.BadRequestException;

@Service
public class CurrencyService {

    private static final Map<String, BigDecimal> FALLBACK_USD_RATES = new HashMap<>();

    static {
        FALLBACK_USD_RATES.put("USD", BigDecimal.ONE);
        FALLBACK_USD_RATES.put("EUR", new BigDecimal("0.92"));
        FALLBACK_USD_RATES.put("INR", new BigDecimal("83.00"));
        FALLBACK_USD_RATES.put("GBP", new BigDecimal("0.78"));
    }

    private final RestTemplate restTemplate = new RestTemplate();

    public CurrencyConversionResponse convert(String from, String to, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        String base = from.toUpperCase();
        String target = to.toUpperCase();

        if (base.equals(target)) {
            return CurrencyConversionResponse.builder()
                    .amount(amount)
                    .from(base)
                    .to(target)
                    .rate(BigDecimal.ONE)
                    .convertedAmount(amount)
                    .build();
        }

        String url = "https://api.exchangerate-api.com/v4/latest/" + base;

        BigDecimal rate;
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
            }
            );

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("rates")) {
                throw new BadRequestException("Unable to fetch exchange rates");
            }

            Map<String, Object> rates = (Map<String, Object>) body.get("rates");
            Object rateObj = rates.get(target);
            if (rateObj == null) {
                throw new BadRequestException("Target currency not supported: " + target);
            }
            rate = new BigDecimal(String.valueOf(rateObj));
        } catch (RestClientException ex) {
            rate = fallbackRate(base, target);
            if (rate == null) {
                throw new BadRequestException("Currency conversion service is temporarily unavailable");
            }
        }

        BigDecimal converted = amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);

        return CurrencyConversionResponse.builder()
                .amount(amount)
                .from(base)
                .to(target)
                .rate(rate)
                .convertedAmount(converted)
                .build();
    }

    private BigDecimal fallbackRate(String from, String to) {
        BigDecimal fromUsd = FALLBACK_USD_RATES.get(from);
        BigDecimal toUsd = FALLBACK_USD_RATES.get(to);
        if (fromUsd == null || toUsd == null) {
            return null;
        }
        return toUsd.divide(fromUsd, 8, RoundingMode.HALF_UP);
    }
}
