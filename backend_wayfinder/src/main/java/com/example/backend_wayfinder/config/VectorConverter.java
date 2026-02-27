package com.example.backend_wayfinder.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.postgresql.util.PGobject;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * JPA Converter for PostgreSQL vector type
 * Converts between ArrayList<Double> (Java) and vector (PostgreSQL)
 */
@Slf4j
@Converter(autoApply = false)
public class VectorConverter implements AttributeConverter<ArrayList<Double>, Object> {

    @Override
    public Object convertToDatabaseColumn(ArrayList<Double> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }

        // Convert ArrayList<Double> to PostgreSQL vector format: [0.1,0.2,0.3,...]
        String vectorString = attribute.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));

        log.debug("Converting {} doubles to vector: {}", attribute.size(),
                vectorString.length() > 100 ? vectorString.substring(0, 100) + "..." : vectorString);

        // Return as PGobject for proper PostgreSQL type handling
        try {
            PGobject pgObject = new PGobject();
            pgObject.setType("vector");
            pgObject.setValue(vectorString);
            return pgObject;
        } catch (SQLException e) {
            log.error("Failed to create PGobject for vector: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public ArrayList<Double> convertToEntityAttribute(Object dbData) {
        if (dbData == null) {
            return new ArrayList<>();
        }

        try {
            String dataString;

            // Handle PGobject
            if (dbData instanceof PGobject pgObject) {
                dataString = pgObject.getValue();
            } else {
                dataString = dbData.toString();
            }

            if (dataString == null || dataString.isEmpty()) {
                return new ArrayList<>();
            }

            // Remove brackets and split by comma
            String cleaned = dataString.trim();
            if (cleaned.startsWith("[")) {
                cleaned = cleaned.substring(1);
            }
            if (cleaned.endsWith("]")) {
                cleaned = cleaned.substring(0, cleaned.length() - 1);
            }

            if (cleaned.isEmpty()) {
                return new ArrayList<>();
            }

            // Parse each value
            ArrayList<Double> result = Arrays.stream(cleaned.split(","))
                    .map(String::trim)
                    .map(Double::parseDouble)
                    .collect(Collectors.toCollection(ArrayList::new));

            log.debug("Converted vector string to {} doubles", result.size());
            return result;

        } catch (Exception e) {
            log.error("Failed to convert vector string to ArrayList<Double>: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}

