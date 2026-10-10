package com.olympiadplatform.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Timestamps are stored as UTC LocalDateTime. On the wire they are ISO-8601 with an explicit "Z",
 * so browsers in any timezone interpret them correctly.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer utcDateTimeCustomizer() {
        return builder -> builder
                .serializerByType(LocalDateTime.class, new UtcSerializer())
                .deserializerByType(LocalDateTime.class, new UtcDeserializer());
    }

    static class UtcSerializer extends JsonSerializer<LocalDateTime> {
        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            gen.writeString(value.atOffset(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
    }

    static class UtcDeserializer extends JsonDeserializer<LocalDateTime> {
        @Override
        public LocalDateTime deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            String text = parser.getText().trim();
            if (text.isEmpty()) {
                return null;
            }
            try {
                return OffsetDateTime.parse(text).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
            } catch (DateTimeParseException ignored) {
                // No offset given: treat as UTC.
                return LocalDateTime.parse(text);
            }
        }
    }
}
