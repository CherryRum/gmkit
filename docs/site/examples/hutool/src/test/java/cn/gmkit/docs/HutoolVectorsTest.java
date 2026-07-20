package cn.gmkit.docs;

import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.SmUtil;
import cn.hutool.crypto.symmetric.SymmetricCrypto;
import org.bouncycastle.crypto.engines.SM4Engine;
import org.bouncycastle.crypto.params.KeyParameter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HutoolVectorsTest {
    @Test
    void verifiesSm3WithHutool() {
        assertEquals(
                "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
                SmUtil.sm3("abc"));
    }

    @Test
    void verifiesSm4BlockWithPinnedBouncyCastle() {
        byte[] key = HexUtil.decodeHex("0123456789abcdeffedcba9876543210");
        byte[] plain = HexUtil.decodeHex("0123456789abcdeffedcba9876543210");
        byte[] ciphertext = new byte[16];
        SM4Engine engine = new SM4Engine();
        engine.init(true, new KeyParameter(key));
        engine.processBlock(plain, 0, ciphertext, 0);
        assertEquals("681edf34d206965e86b3e94f536e4246", HexUtil.encodeHexStr(ciphertext));

        // 构造 Hutool 入口，确保文档声明的 Hutool + BC 组合在固定版本下可加载。
        SymmetricCrypto ignored = SmUtil.sm4(key);
    }
}
