package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.RunCodeRequest;
import com.olympiadplatform.dto.response.RunCodeResponse;
import com.olympiadplatform.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class Judge0Service {

    private final RestClient.Builder restClientBuilder;

    @Value("${app.judge0.url:https://ce.judge0.com}")
    private String judge0Url;

    public RunCodeResponse run(RunCodeRequest request) {
        Judge0Submission submission = new Judge0Submission(
                request.getSourceCode(),
                request.getLanguageId(),
                request.getStdin()
        );

        Judge0Result result;
        try {
            result = restClientBuilder.build()
                    .post()
                    .uri(judge0Url + "/submissions?base64_encoded=false&wait=true")
                    .body(submission)
                    .retrieve()
                    .body(Judge0Result.class);
        } catch (RestClientException ex) {
            throw new BusinessException("Сервис выполнения кода недоступен", ex);
        }

        if (result == null) {
            throw new BusinessException("Сервис выполнения кода не вернул результат");
        }

        return RunCodeResponse.builder()
                .stdout(result.stdout)
                .stderr(result.stderr)
                .compileOutput(result.compileOutput)
                .message(result.message)
                .status(result.status == null ? null : result.status.description)
                .statusId(result.status == null ? null : result.status.id)
                .time(result.time)
                .memory(result.memory)
                .build();
    }

    private record Judge0Submission(
            @com.fasterxml.jackson.annotation.JsonProperty("source_code")
            String sourceCode,
            @com.fasterxml.jackson.annotation.JsonProperty("language_id")
            Integer languageId,
            String stdin
    ) {}

    private record Judge0Result(
            String stdout,
            String stderr,
            @com.fasterxml.jackson.annotation.JsonProperty("compile_output")
            String compileOutput,
            String message,
            Judge0Status status,
            String time,
            Integer memory
    ) {}

    private record Judge0Status(Integer id, String description) {}
}
