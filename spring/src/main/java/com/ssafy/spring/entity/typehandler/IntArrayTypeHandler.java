package com.ssafy.spring.entity.typehandler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;
import java.util.Arrays;
import java.util.stream.Collectors;

public class IntArrayTypeHandler extends BaseTypeHandler<int[]> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, int[] parameter, JdbcType jdbcType) throws SQLException {
        String arrayString = "{" + Arrays.stream(parameter)
                .mapToObj(String::valueOf)
                .collect(Collectors.joining(",")) + "}";
        ps.setString(i, arrayString);
    }

    private int[] parseArray(String result) {
        if (result == null || result.trim().isEmpty()) {
            return new int[0];
        }

        result = result.replaceAll("[{}\\s\"]", "");
        if (result.isEmpty()) return new int[0];

        return Arrays.stream(result.split(","))
                .mapToInt(Integer::parseInt)
                .toArray();
    }

    @Override
    public int[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseArray(rs.getString(columnName));
    }

    @Override
    public int[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseArray(rs.getString(columnIndex));
    }

    @Override
    public int[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseArray(cs.getString(columnIndex));
    }
}
