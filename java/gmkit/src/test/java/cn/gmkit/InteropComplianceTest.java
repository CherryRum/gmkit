package cn.gmkit;

import cn.gmkit.sm3.SM3Util;
import cn.gmkit.test.Vectors;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.DynamicTest.dynamicTest;

/**
 * 跨语言互通向量测试：读取根 {@code /vectors/interop.json}，
 * 校验 Java 侧实现与 TypeScript 侧实现产生相同的字节级输出。
 *
 * <p>同一份 JSON 文件被 {@code ts/test/interop-compliance.test.ts} 也加载。
 * 任一侧改动 {@code /vectors/} 会在 CI 同时触发两栈。
 *
 * <p>本期覆盖 SM3 摘要（{@code op == "digest"}）；后续小迭代扩展 SM4 / SM2 / ZUC。
 */
class InteropComplianceTest {

    @TestFactory
    @SuppressWarnings("unchecked")
    Collection<DynamicTest> sm3DigestVectorsMatchTypeScript() throws Exception {
        Map<String, Object> root = (Map<String, Object>) Vectors.load("/vectors/interop.json");
        List<Map<String, Object>> cases = (List<Map<String, Object>>) root.get("cases");
        List<DynamicTest> tests = new ArrayList<>();
        if (cases == null) return tests;
        for (Map<String, Object> v : cases) {
            if (!"SM3".equals(v.get("algo")) || !"digest".equals(v.get("op"))) continue;
            String id = (String) v.get("id");
            String input = (String) v.get("input");
            Map<String, Object> expected = (Map<String, Object>) v.get("expected");
            String expectedHex = expected == null ? null : (String) expected.get("hex");
            if (id == null || input == null || expectedHex == null) continue;
            tests.add(dynamicTest(id, () -> {
                String actualHex = SM3Util.digestHex(input.getBytes(StandardCharsets.UTF_8));
                assertEquals(expectedHex.toLowerCase(), actualHex.toLowerCase(),
                        "SM3 digest mismatch for vector: " + id);
            }));
        }
        return tests;
    }
}