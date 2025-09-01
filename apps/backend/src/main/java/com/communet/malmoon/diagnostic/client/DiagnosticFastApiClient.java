package com.communet.malmoon.diagnostic.client;

import com.communet.malmoon.diagnostic.dto.*;
import com.communet.malmoon.diagnostic.infra.MultipartInputResource;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Objects;
import java.util.function.Supplier;
import java.util.List;
/**
 * FastAPI 연동: STT, LLM 평가
 */
@Component
@RequiredArgsConstructor
public class DiagnosticFastApiClient {

    @Value("${external.fastapi.url:http://localhost:8000}")
    private String baseUrl;


    private final RestTemplate restTemplate = new RestTemplate();

    /** STT 호출 (multipart) + 지수 백오프 재시도 */
    public String transcribe(MultipartFile file, int maxRetry) {
        final String url = baseUrl + "/api/v1/stt/transcribe";
        return executeWithRetry(() -> {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            try {
                body.add("file", new HttpEntity<>(new MultipartInputResource(file), createFileHeaders(file)));
            } catch (IOException e) { throw new RuntimeException("Failed to wrap multipart file", e); }

            ResponseEntity<TranscribeOut> resp = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), TranscribeOut.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) throw new RuntimeException("STT failed");
            return Objects.requireNonNull(resp.getBody()).getText();
        }, maxRetry);
    }

    /** LLM 평가 호출 (JSON) + 지수 백오프 재시도 */
    public FeedbackEvalResponseDto evaluateFeedback(List<WordsPair> dto, int maxRetry) {
        final String url = baseUrl + "/api/v1/feedback/initial-eval";
        return executeWithRetry(() -> {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<FeedbackEvalResponseDto> resp =
                    restTemplate.postForEntity(url, new HttpEntity<>(dto, headers), FeedbackEvalResponseDto.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) throw new RuntimeException("Eval failed");
            return resp.getBody();
        }, maxRetry);
    }

    private HttpHeaders createFileHeaders(MultipartFile file) {
        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"));
        ContentDisposition cd = ContentDisposition.builder("form-data")
                .name("file")
                .filename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file")
                .build();
        partHeaders.setContentDisposition(cd);
        return partHeaders;
    }

    private <T> T executeWithRetry(Supplier<T> call, int maxRetry) {
        int attempt = 0; long backoff = 400L;
        while (true) {
            try { return call.get(); }
            catch (Exception e) {
                if (++attempt > maxRetry) throw e;
                try { Thread.sleep(backoff); } catch (InterruptedException ignored) {}
                backoff *= 2;
            }
        }
    }
}
