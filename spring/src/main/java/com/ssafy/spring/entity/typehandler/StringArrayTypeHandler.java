package com.ssafy.spring.entity.typehandler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;
import java.util.Arrays;

public class StringArrayTypeHandler extends BaseTypeHandler<String[]> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, String[] parameter, JdbcType jdbcType) throws SQLException {
        // PostgreSQL 배열 형식으로 문자열 구성: {"a","b","c"}
        String arrayString = "{" + String.join(",", Arrays.stream(parameter)
                .map(s -> "\"" + s + "\"") // 각 문자열을 쌍따옴표로 감싸기
                .toArray(String[]::new)) + "}";
        ps.setString(i, arrayString);
    }

    @Override
    public String[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseArray(rs.getString(columnName));
    }

    @Override
    public String[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseArray(rs.getString(columnIndex));
    }

    @Override
    public String[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseArray(cs.getString(columnIndex));
    }

    private String[] parseArray(String result) {
        if (result == null || result.trim().isEmpty()) return new String[0];
        result = result.replaceAll("[{}\"]", ""); // {“a”,“b”} → a,b
        return result.split(",");
    }
}
