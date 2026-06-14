package cn.gmkit;

import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.sm3.SM3Util;
import cn.gmkit.sm4.SM4Options;
import cn.gmkit.sm4.SM4Util;
import cn.gmkit.test.Vectors;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.DynamicTest.dynamicTest;

/**
 * 跨语言互通向量测试：读取根 {@code /vectors/interop.json}，
 * 校验 Java 与 TypeScript 实现产生相同的字节级输出。
 */
class InteropComplianceTest {

    @TestFactory
    Collection<DynamicTest> sm3DigestVectorsMatchTypeScript() throws Exception {
        return iterate("SM3", "digest", v -> {
            String id = (String) v.get("id");
            String input = (String) v.get("input");
            String expectedHex = expectedHex(v, "hex");
            if (id == null || input == null || expectedHex == null) return null;
            return dynamicTest(id, () -> {
                String actualHex = SM3Util.digestHex(input.getBytes(StandardCharsets.UTF_8));
                assertEquals(expectedHex.toLowerCase(), actualHex.toLowerCase(),
                        "SM3 digest mismatch: " + id);
            });
        });
    }

    @TestFactory
    Collection<DynamicTest> sm4EncryptVectorsMatchTypeScript() throws Exception {
        return iterate("SM4", "encrypt", v -> {
            String id = (String) v.get("id");
            String mode = (String) v.get("mode");
            String padding = (String) v.get("padding");
            String keyHex = (String) v.get("keyHex");
            String ivHex = (String) v.get("ivHex");
            String input = (String) v.get("input");
            String expectedHex = expectedHex(v, "cipherHex");
            if (id == null || mode == null || padding == null
                    || keyHex == null || input == null || expectedHex == null) {
                return null;
            }
            if (!"PKCS7".equals(padding)) return null; // future iters add NONE/ZERO
            SM4CipherMode m;
            if ("ECB".equals(mode)) m = SM4CipherMode.ECB;
            else if ("CBC".equals(mode)) m = SM4CipherMode.CBC;
            else return null; // CTR/CFB/OFB/GCM/CCM待后续小迭代
            return dynamicTest(id, () -> {
                byte[] key = HexCodec.decodeStrict(keyHex, "sm4.keyHex");
                byte[] data = input.getBytes(StandardCharsets.UTF_8);
                SM4Options.Builder ob = SM4Options.builder().mode(m);
                if (ivHex != null) ob.iv(HexCodec.decodeStrict(ivHex, "sm4.ivHex"));
                byte[] cipher = SM4Util.encrypt(key, data, ob.build()).ciphertext();
                assertEquals(expectedHex.toLowerCase(), HexCodec.encode(cipher),
                        "SM4 " + mode + "/" + padding + " cipher mismatch: " + id);
            });
        });
    }

    @SuppressWarnings("unchecked")
    private static Collection<DynamicTest> iterate(String algo, String op,
            Function<Map<String, Object>, DynamicTest> mapper) throws Exception {
        Map<String, Object> root = (Map<String, Object>) Vectors.load("/vectors/interop.json");
        List<Map<String, Object>> cases = (List<Map<String, Object>>) root.get("cases");
        List<DynamicTest> tests = new ArrayList<>();
        if (cases == null) return tests;
        for (Map<String, Object> v : cases) {
            if (!algo.equals(v.get("algo")) || !op.equals(v.get("op"))) continue;
            DynamicTest t = mapper.apply(v);
            if (t != null) tests.add(t);
        }
        return tests;
    }

    @SuppressWarnings("unchecked")
    private static String expectedHex(Map<String, Object> v, String field) {
        Map<String, Object> expected = (Map<String, Object>) v.get("expected");
        return expected == null ? null : (String) expected.get(field);
    }
}