package com.olympiadplatform.service;

import com.olympiadplatform.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerifier {

    private final RestClient.Builder restClientBuilder;

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    public GoogleProfile verify(String idToken) {
        GoogleTokenInfo tokenInfo;
        try {
            tokenInfo = restClientBuilder.build()
                    .get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={idToken}", idToken)
                    .retrieve()
                    .body(GoogleTokenInfo.class);
        } catch (RestClientException ex) {
            throw new BusinessException("Google token verification failed", ex);
        }

        if (tokenInfo == null || tokenInfo.email == null || !"true".equalsIgnoreCase(tokenInfo.emailVerified)) {
            throw new BusinessException("Google token is invalid");
        }

        if (!googleClientId.isBlank() && !googleClientId.equals(tokenInfo.aud)) {
            throw new BusinessException("Google token audience is invalid");
        }

        return new GoogleProfile(tokenInfo.sub, tokenInfo.email, tokenInfo.name == null ? tokenInfo.email : tokenInfo.name);
    }

    public record GoogleProfile(String id, String email, String name) {}

    private record GoogleTokenInfo(
            String sub,
            String aud,
            String email,
            @com.fasterxml.jackson.annotation.JsonProperty("email_verified")
            String emailVerified,
            String name
    ) {}
}
