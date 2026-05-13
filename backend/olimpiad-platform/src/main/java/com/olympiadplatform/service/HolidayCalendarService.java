package com.olympiadplatform.service;

import com.olympiadplatform.dto.response.HolidayResponse;
import com.olympiadplatform.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayCalendarService {

    private final RestClient.Builder restClientBuilder;

    @Value("${app.calendar.nager-date-url:https://date.nager.at}")
    private String nagerDateUrl;

    public List<HolidayResponse> getPublicHolidays(int year, String countryCode) {
        if (year < 2000 || year > 2100) {
            throw new BusinessException("Year must be between 2000 and 2100");
        }
        if (countryCode == null || !countryCode.matches("^[A-Za-z]{2}$")) {
            throw new BusinessException("Country code must use ISO 3166-1 alpha-2 format");
        }

        NagerHoliday[] holidays;
        try {
            holidays = restClientBuilder.build()
                    .get()
                    .uri(nagerDateUrl + "/api/v3/PublicHolidays/{year}/{countryCode}",
                            year,
                            countryCode.toUpperCase())
                    .retrieve()
                    .body(NagerHoliday[].class);
        } catch (RestClientException ex) {
            throw new BusinessException("Holiday calendar API is unavailable", ex);
        }

        if (holidays == null) {
            return List.of();
        }

        return Arrays.stream(holidays)
                .map(holiday -> HolidayResponse.builder()
                        .date(holiday.date)
                        .localName(holiday.localName)
                        .name(holiday.name)
                        .countryCode(holiday.countryCode)
                        .global(holiday.global)
                        .build())
                .toList();
    }

    private record NagerHoliday(
            LocalDate date,
            String localName,
            String name,
            String countryCode,
            boolean global
    ) {}
}
