package com.olympiadplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class OlympiadPlatformApplication {
    public static void main(String[] args) {
        // All LocalDateTime values in the DB and API are UTC; clients convert to local time.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(OlympiadPlatformApplication.class, args);
    }
}
