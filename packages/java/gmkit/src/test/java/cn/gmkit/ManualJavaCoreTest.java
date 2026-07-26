// #region manual-java-core
package cn.gmkit;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.BcProviders;
import cn.gmkit.core.ByteEncodings;
import cn.gmkit.core.Bytes;
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.InputFormat;
import cn.gmkit.core.OutputFormat;
import cn.gmkit.core.Texts;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ManualJavaCoreTest {

    @Test
    void usesExplicitTextAndBinaryFormats() {
        // 1. 准备二进制：该字节序列包含 NUL、非 ASCII 字节和字母 A。
        byte[] binary = new byte[] {0x00, (byte) 0xff, (byte) 0x80, 0x41};

        // 2. 编码二进制：协议字段分别输出为小写 Hex 和 RFC 4648 Base64。
        String hex = ByteEncodings.encode(binary, OutputFormat.HEX);
        String base64 = ByteEncodings.encode(binary, OutputFormat.BASE64);
        assertEquals("00ff8041", hex);
        assertEquals("AP+AQQ==", base64);

        // 3. 显式解码：接收方按协议声明的格式恢复相同字节。
        assertArrayEquals(binary, ByteEncodings.decode(hex, InputFormat.HEX, "payload"));
        assertArrayEquals(binary, ByteEncodings.decode(base64, InputFormat.BASE64, "payload"));

        // 4. UTF-8 往返：文本转换与任意二进制转换分开处理。
        String plaintext = "订单 GMKIT-DEMO-0001";
        assertEquals(plaintext, Texts.text(Texts.bytes(plaintext, StandardCharsets.UTF_8), StandardCharsets.UTF_8));
        assertEquals(hex, HexCodec.encode(HexCodec.decodeStrict(hex, "payload")));
        assertEquals(base64, Base64Codec.encode(Base64Codec.decode(base64, "payload")));

        // 5. 比较失败断言：内容不同的认证值必须返回 false。
        byte[] tampered = binary.clone();
        tampered[3] ^= 0x01;
        assertFalse(Bytes.constantTimeEquals(binary, tampered));

        // 6. 非法输入断言：奇数长度或包含非 Hex 字符时必须抛出 GmkitException。
        assertThrows(GmkitException.class, () -> HexCodec.decodeStrict("abc", "payload"));
        assertThrows(GmkitException.class, () -> HexCodec.decodeStrict("00xz", "payload"));

        // 7. 创建安全上下文：固定 Provider 和 SecureRandom，关闭自动全局注册。
        GmSecurityContext context = GmSecurityContext.builder()
            .provider(BcProviders.create())
            .secureRandom(new SecureRandom())
            .registerProvider(false)
            .build();
        assertFalse(context.registerProvider());
        assertEquals("BC", context.provider().getName());
    }
}
// #endregion manual-java-core
