package cn.gmkit.test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 极简 JSON 解析器：支持对象、数组、字符串、整数、{@code true/false/null}。
 * 浮点数会读为 {@link Double}，整数读为 {@link Long}。
 *
 * <p>仅用于读取测试向量。不做性能优化，不做严格 RFC 8259 校验，
 * 不支持 NaN/Infinity，不支持注释。
 */
final class MiniJson {

    private final String src;
    private int pos;

    MiniJson(String src) {
        this.src = src;
    }

    Object parseValue() {
        skipWs();
        if (pos >= src.length()) {
            throw new IllegalStateException("unexpected end of input");
        }
        char c = src.charAt(pos);
        if (c == '{') return parseObject();
        if (c == '[') return parseArray();
        if (c == '"') return parseString();
        if (c == 't' || c == 'f') return parseBool();
        if (c == 'n') return parseNull();
        if (c == '-' || (c >= '0' && c <= '9')) return parseNumber();
        throw new IllegalStateException("unexpected char '" + c + "' at " + pos);
    }

    private Map<String, Object> parseObject() {
        Map<String, Object> m = new LinkedHashMap<>();
        expect('{'); skipWs();
        if (peek() == '}') { pos++; return m; }
        while (true) {
            skipWs();
            String k = parseString();
            skipWs(); expect(':');
            Object v = parseValue();
            m.put(k, v);
            skipWs();
            if (peek() == ',') { pos++; continue; }
            if (peek() == '}') { pos++; return m; }
            throw new IllegalStateException("expected , or } at " + pos);
        }
    }

    private List<Object> parseArray() {
        List<Object> a = new ArrayList<>();
        expect('['); skipWs();
        if (peek() == ']') { pos++; return a; }
        while (true) {
            a.add(parseValue());
            skipWs();
            if (peek() == ',') { pos++; continue; }
            if (peek() == ']') { pos++; return a; }
            throw new IllegalStateException("expected , or ] at " + pos);
        }
    }

    private String parseString() {
        expect('"');
        StringBuilder sb = new StringBuilder();
        while (pos < src.length()) {
            char c = src.charAt(pos++);
            if (c == '"') return sb.toString();
            if (c == '\\') {
                if (pos >= src.length()) throw new IllegalStateException("bad escape");
                char e = src.charAt(pos++);
                switch (e) {
                    case '"': sb.append('"'); break;
                    case '\\': sb.append('\\'); break;
                    case '/': sb.append('/'); break;
                    case 'b': sb.append('\b'); break;
                    case 'f': sb.append('\f'); break;
                    case 'n': sb.append('\n'); break;
                    case 'r': sb.append('\r'); break;
                    case 't': sb.append('\t'); break;
                    case 'u':
                        if (pos + 4 > src.length()) throw new IllegalStateException("bad \\u");
                        sb.append((char) Integer.parseInt(src.substring(pos, pos + 4), 16));
                        pos += 4;
                        break;
                    default: throw new IllegalStateException("bad escape \\" + e);
                }
            } else {
                sb.append(c);
            }
        }
        throw new IllegalStateException("unterminated string");
    }

    private Object parseNumber() {
        int start = pos;
        if (peek() == '-') pos++;
        while (pos < src.length() && isDigit(src.charAt(pos))) pos++;
        boolean isFloat = false;
        if (pos < src.length() && src.charAt(pos) == '.') {
            isFloat = true;
            pos++;
            while (pos < src.length() && isDigit(src.charAt(pos))) pos++;
        }
        if (pos < src.length() && (src.charAt(pos) == 'e' || src.charAt(pos) == 'E')) {
            isFloat = true;
            pos++;
            if (pos < src.length() && (src.charAt(pos) == '+' || src.charAt(pos) == '-')) pos++;
            while (pos < src.length() && isDigit(src.charAt(pos))) pos++;
        }
        String s = src.substring(start, pos);
        return isFloat ? (Object) Double.parseDouble(s) : (Object) Long.parseLong(s);
    }

    private Boolean parseBool() {
        if (src.startsWith("true", pos)) { pos += 4; return Boolean.TRUE; }
        if (src.startsWith("false", pos)) { pos += 5; return Boolean.FALSE; }
        throw new IllegalStateException("bad boolean at " + pos);
    }

    private Object parseNull() {
        if (src.startsWith("null", pos)) { pos += 4; return null; }
        throw new IllegalStateException("bad null at " + pos);
    }

    private void skipWs() {
        while (pos < src.length()) {
            char c = src.charAt(pos);
            if (c == ' ' || c == '\t' || c == '\n' || c == '\r') pos++;
            else break;
        }
    }

    private char peek() {
        if (pos >= src.length()) throw new IllegalStateException("unexpected end");
        return src.charAt(pos);
    }

    private void expect(char c) {
        if (pos >= src.length() || src.charAt(pos) != c) {
            throw new IllegalStateException("expected '" + c + "' at " + pos);
        }
        pos++;
    }

    private static boolean isDigit(char c) {
        return c >= '0' && c <= '9';
    }
}