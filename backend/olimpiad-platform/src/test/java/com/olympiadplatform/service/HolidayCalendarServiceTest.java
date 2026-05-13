package com.olympiadplatform.service;

import com.olympiadplatform.dto.response.HolidayResponse;
import com.olympiadplatform.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class HolidayCalendarServiceTest {

    private HolidayCalendarService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new HolidayCalendarService(builder);
        ReflectionTestUtils.setField(service, "nagerDateUrl", "https://date.nager.at");
    }

    @Test
    void getPublicHolidaysReturnsMappedCalendarData() {
        server.expect(requestTo("https://date.nager.at/api/v3/PublicHolidays/2026/BY"))
                .andRespond(withSuccess("""
                        [
                          {
                            "date": "2026-01-01",
                            "localName": "Новы год",
                            "name": "New Year's Day",
                            "countryCode": "BY",
                            "global": true
                          }
                        ]
                        """, org.springframework.http.MediaType.APPLICATION_JSON));

        List<HolidayResponse> result = service.getPublicHolidays(2026, "by");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getLocalName()).isEqualTo("Новы год");
        assertThat(result.getFirst().getCountryCode()).isEqualTo("BY");
        assertThat(result.getFirst().isGlobal()).isTrue();
        server.verify();
    }

    @Test
    void getPublicHolidaysRejectsInvalidCountryCode() {
        assertThatThrownBy(() -> service.getPublicHolidays(2026, "BLR"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Country code must use ISO 3166-1 alpha-2 format");
    }
}
