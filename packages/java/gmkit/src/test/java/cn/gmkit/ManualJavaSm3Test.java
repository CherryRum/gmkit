// #region manual-java-sm3
package cn.gmkit;

import cn.gmkit.core.Bytes;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.Texts;
import cn.gmkit.sm3.SM3Util;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManualJavaSm3Test {

    @Test
    void digestsAndAuthenticatesExplicitBytes() {
        // 1. 准备参数：固定向量使用 abc，业务消息使用正常金额与篡改金额。
        String plaintext = "order=GMKIT-DEMO-0001&amount=88.00";
        String tampered = "order=GMKIT-DEMO-0001&amount=99.00";
        byte[] hmacKey = Texts.bytes("merchant-demo-key", StandardCharsets.UTF_8);

        // 2. 计算 SM3 摘要：固定向量必须等于 64 个小写 Hex 字符。
        assertEquals(
            "66c7f0f462eeedd9d1f2d46bdc10e4e2"
                + "4167c4875cf2f7a2297da02b8f4ba8e0",
            SM3Util.digestHex("abc", StandardCharsets.UTF_8));

        // 3. 比对文本与字节：显式 UTF-8 的 String 重载必须等于 byte[] 重载。
        byte[] textDigest = SM3Util.digest(plaintext, StandardCharsets.UTF_8);
        byte[] byteDigest = SM3Util.digest(Texts.bytes(plaintext, StandardCharsets.UTF_8));
        assertArrayEquals(textDigest, byteDigest);

        // 4. 计算 HMAC-SM3：共享 key 认证正常业务消息。
        byte[] mac = SM3Util.hmac(hmacKey, plaintext, StandardCharsets.UTF_8);

        // 5. HMAC 成功断言：接收端重新计算后使用常量时间字节比较。
        assertTrue(Bytes.constantTimeEquals(
            mac,
            SM3Util.hmac(hmacKey, plaintext, StandardCharsets.UTF_8)));

        // 6. 篡改断言：金额变化后 HMAC-SM3 必须不同。
        assertFalse(Bytes.constantTimeEquals(
            mac,
            SM3Util.hmac(hmacKey, tampered, StandardCharsets.UTF_8)));

        // 7. 非法输入断言：null 消息不能被当作空消息计算摘要。
        assertThrows(GmkitException.class, () -> SM3Util.digest((byte[]) null));
    }
}
// #endregion manual-java-sm3
