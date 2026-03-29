package com.expense.reimbursement.service;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.expense.reimbursement.dto.response.OcrScanResponse;
import com.expense.reimbursement.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class OcrService {

    private final RestTemplate restTemplate;
    private final String ocrServiceUrl;
    private final String defaultOrgCurrency;

    public OcrService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.ocr.service-url:http://localhost:8000}") String ocrServiceUrl,
            @Value("${app.ocr.default-org-currency:INR}") String defaultOrgCurrency
    ) {
        this.restTemplate = restTemplateBuilder.build();
        this.ocrServiceUrl = ocrServiceUrl;
        this.defaultOrgCurrency = defaultOrgCurrency;
    }

    public OcrScanResponse scanReceipt(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Receipt file is required");
        }

        String originalFilename = StringUtils.hasText(file.getOriginalFilename())
                ? file.getOriginalFilename()
                : "receipt.jpg";

        JsonNode data = callOcrService(file, originalFilename);
        String amount = firstNonBlank(
                textOrNull(data.path("total")),
                textOrNull(data.path("subtotal")),
                textOrNull(data.path("tax"))
        );
        String date = textOrNull(data.path("date"));
        String vendor = textOrNull(data.path("vendor"));
        String category = textOrNull(data.path("category"));

        String description = StringUtils.hasText(vendor)
                ? String.format("%s%s", vendor, StringUtils.hasText(category) ? " (" + category + ")" : "")
                : "OCR extracted data from " + originalFilename;

        return OcrScanResponse.builder()
                .amount(amount)
                .date(date)
                .description(description)
                .build();
    }

    private JsonNode callOcrService(MultipartFile file, String originalFilename) {
        try {
            HttpHeaders fileHeaders = new HttpHeaders();
            if (StringUtils.hasText(file.getContentType())) {
                fileHeaders.setContentType(MediaType.parseMediaType(file.getContentType()));
            }

            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return originalFilename;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new HttpEntity<>(fileResource, fileHeaders));
            body.add("org_currency", defaultOrgCurrency);
            body.add("include_raw_text", "false");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    ocrServiceUrl + "/ocr/extract",
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );

            JsonNode root = response.getBody();
            if (root == null) {
                throw new BadRequestException("OCR service returned empty response");
            }
            if (!root.path("success").asBoolean(false)) {
                throw new BadRequestException(firstNonBlank(textOrNull(root.path("error")), "OCR scan failed"));
            }
            return root.path("data");
        } catch (IOException ex) {
            throw new BadRequestException("Failed to read uploaded receipt: " + ex.getMessage());
        } catch (RestClientException ex) {
            throw new BadRequestException("OCR service is unavailable. Please ensure it is running at " + ocrServiceUrl);
        }
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return StringUtils.hasText(value) ? value : null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }
}
