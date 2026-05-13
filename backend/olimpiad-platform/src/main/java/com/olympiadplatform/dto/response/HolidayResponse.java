package com.olympiadplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HolidayResponse {
    private LocalDate date;
    private String localName;
    private String name;
    private String countryCode;
    private boolean global;
}
