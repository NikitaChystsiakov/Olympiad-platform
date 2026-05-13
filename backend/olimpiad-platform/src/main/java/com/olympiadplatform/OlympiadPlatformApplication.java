package com.olympiadplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OlympiadPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(OlympiadPlatformApplication.class, args);
        System.out.println("========================================");
        System.out.println("✅ Сервер запущен на http://localhost:8080");
        System.out.println("========================================");
    }
}