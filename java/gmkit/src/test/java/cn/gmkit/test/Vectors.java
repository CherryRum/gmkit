package cn.gmkit.test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 加载共享 /vectors/ 目录下的 JSON 测试向量。
 *
 * <p>Maven 的 test-resources 配置（见 gmkit/pom.xml）把仓库根的 {@code /vectors/} 目录
 * 暴露到测试 classpath 的 {@code /vectors/} 路径下。本类提供极简的 JSON 反序列化，
 * 避免引入 Jackson / Gson 等额外测试依赖。
 *
 * <p>支持的 JSON 子集：对象、数组、字符串、整数、{@code true/false/null}。
 * 仅用于读取受控的测试向量文件，不适合通用 JSON 解析。
 */
public final class Vectors {

    private Vectors() {
        // utility
    }

    /**
     * 从 classpath 读取并解析共享向量。
     *
     * @param resource 例如 {@code "/vectors/interop.json"}
     * @return 解析后的对象树（{@link Map}, {@link List}, {@link String}, {@link Number}, {@link Boolean}, {@code null}）
     * @throws IOException 文件读取失败时抛出
     */
    public static Object load(String resource) throws IOException {
        try (InputStream in = Vectors.class.getResourceAsStream(resource)) {
            if (in == null) {
                throw new IOException("classpath resource not found: " + resource);
            }
            StringBuilder sb = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                char[] buf = new char[8192];
                int n;
                while ((n = r.read(buf)) >= 0) {
                    sb.append(buf, 0, n);
                }
            }
            return new MiniJson(sb.toString()).parseValue();
        }
    }
}