// #region manual-java-sm4
package cn.gmkit;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManualJavaSm4Test {

    @Test
    void encryptsAuthenticatesAndRejectsTampering() {
        // 1. 准备参数：SM4 key 为 16 字节，GCM nonce 为 12 字节，AAD 按 UTF-8 编码。
        byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
        byte[] nonce = HexCodec.decodeStrict("000102030405060708090a0b", "SM4 nonce");
        byte[] aad = "tenant=demo;schema=1".getBytes(StandardCharsets.UTF_8);
        String plaintext = "order=GMKIT-DEMO-0001&amount=88.00";
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .iv(nonce)
            .aad(aad)
            .tagLength(16)
            .build();

        // 2. SM4-GCM 加密：结果分别包含 ciphertext 和 16 字节认证 tag。
        SM4 sm4 = new SM4();
        SM4CipherResult encrypted = sm4.encrypt(key, plaintext, StandardCharsets.UTF_8, options);
        assertTrue(encrypted.hasTag());
        assertEquals(16, encrypted.tag().length);

        // 3. 编码传输字段：ciphertext 和 tag 分别使用 Base64，不序列化 Java 对象。
        String ciphertextBase64 = encrypted.ciphertextBase64();
        String tagBase64 = encrypted.tagBase64();
        SM4CipherResult received = new SM4CipherResult(
            Base64Codec.decode(ciphertextBase64, "SM4 ciphertext"),
            Base64Codec.decode(tagBase64, "SM4 tag"));

        // 4. SM4-GCM 解密：相同 nonce、AAD 和 tag 通过认证后恢复 UTF-8 原文。
        String decrypted = sm4.decryptToString(key, received, StandardCharsets.UTF_8, options);
        assertEquals(plaintext, decrypted);

        // 5. 认证失败断言：修改 tag 后必须抛出 GmkitException，不能返回明文。
        byte[] tamperedTag = received.tag();
        tamperedTag[0] ^= 0x01;
        SM4CipherResult tampered = new SM4CipherResult(received.ciphertext(), tamperedTag);
        assertThrows(GmkitException.class, () -> sm4.decrypt(key, tampered, options));

        // 6. AAD 失败断言：接收端 AAD 不同也必须拒绝解密。
        SM4Options wrongAad = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .iv(nonce)
            .aad("tenant=other;schema=1".getBytes(StandardCharsets.UTF_8))
            .tagLength(16)
            .build();
        assertThrows(GmkitException.class, () -> sm4.decrypt(key, received, wrongAad));

        // 7. 二进制加密：不可打印字节直接以 byte[] 进入 SM4-GCM。
        byte[] binary = new byte[] {0x00, (byte) 0xff, (byte) 0x80, 0x41};
        SM4Options binaryOptions = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .iv(HexCodec.decodeStrict("0c0d0e0f1011121314151617", "SM4 nonce"))
            .aad(aad)
            .tagLength(16)
            .build();
        SM4CipherResult binaryEncrypted = sm4.encrypt(key, binary, binaryOptions);

        // 8. 二进制解密：返回 byte[] 并原样恢复 00 ff 80 41。
        assertArrayEquals(binary, sm4.decrypt(key, binaryEncrypted, binaryOptions));
    }
}
// #endregion manual-java-sm4
