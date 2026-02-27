package com.example.backend_wayfinder.config;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;
import org.postgresql.util.PGobject;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Custom Hibernate UserType for PostgreSQL vector type
 * This provides better control over NULL handling than AttributeConverter
 */
public class VectorType implements UserType<ArrayList<Double>> {

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<ArrayList<Double>> returnedClass() {
        return (Class<ArrayList<Double>>) (Class<?>) ArrayList.class;
    }

    @Override
    public boolean equals(ArrayList<Double> x, ArrayList<Double> y) {
        if (x == y) return true;
        if (x == null || y == null) return false;
        return x.equals(y);
    }

    @Override
    public int hashCode(ArrayList<Double> x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public ArrayList<Double> nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner) throws SQLException {
        Object value = rs.getObject(position);

        if (value == null || rs.wasNull()) {
            return new ArrayList<>();
        }

        String dataString;
        if (value instanceof PGobject) {
            PGobject pgObject = (PGobject) value;
            dataString = pgObject.getValue();
        } else {
            dataString = value.toString();
        }

        if (dataString == null || dataString.isEmpty()) {
            return new ArrayList<>();
        }

        // Remove brackets and parse
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

        return Arrays.stream(cleaned.split(","))
                .map(String::trim)
                .map(Double::parseDouble)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    @Override
    public void nullSafeSet(PreparedStatement st, ArrayList<Double> value, int index, SharedSessionContractImplementor session) throws SQLException {
        if (value == null || value.isEmpty()) {
            st.setNull(index, Types.OTHER);
        } else {
            String vectorString = value.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(",", "[", "]"));

            PGobject pgObject = new PGobject();
            pgObject.setType("vector");
            pgObject.setValue(vectorString);
            st.setObject(index, pgObject);
        }
    }

    @Override
    public ArrayList<Double> deepCopy(ArrayList<Double> value) {
        return value == null ? null : new ArrayList<>(value);
    }

    @Override
    public boolean isMutable() {
        return true;
    }

    @Override
    public Serializable disassemble(ArrayList<Double> value) {
        return (Serializable) deepCopy(value);
    }

    @Override
    public ArrayList<Double> assemble(Serializable cached, Object owner) {
        return (ArrayList<Double>) cached;
    }

    @Override
    public ArrayList<Double> replace(ArrayList<Double> detached, ArrayList<Double> managed, Object owner) {
        return deepCopy(detached);
    }
}

