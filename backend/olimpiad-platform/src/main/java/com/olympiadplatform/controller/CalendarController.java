package com.olympiadplatform.controller;

import com.olympiadplatform.dto.response.HolidayResponse;
import com.olympiadplatform.service.HolidayCalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final HolidayCalendarService holidayCalendarService;

    @GetMapping("/holidays")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<List<HolidayResponse>> getPublicHolidays(
            @RequestParam int year,
            @RequestParam(defaultValue = "BY") String countryCode
    ) {
        return ResponseEntity.ok(holidayCalendarService.getPublicHolidays(year, countryCode));
    }
}
