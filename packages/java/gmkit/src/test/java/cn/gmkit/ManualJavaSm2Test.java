// #region manual-java-sm2
package cn.gmkit;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.core.SM2SignatureInputFormat;
import cn.gmkit.core.Texts;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyExchangeOptions;
import cn.gmkit.sm2.SM2KeyExchangeResult;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManualJavaSm2Test {

    @Test
    void signsEncryptsAndExchangesKeys() {
        // 1. 准备参数：固定业务消息、篡改消息和非空 SM2 用户标识。
        String plaintext = "order=GMKIT-DEMO-0001&amount=88.00";
        String tampered = "order=GMKIT-DEMO-0001&amount=99.00";
        String userId = "merchant@gmkit.cn";
        SM2 sm2 = new SM2();

        // 2. 生成 SM2 密钥：私钥为 32 字节 Hex，公钥默认为 65 字节非压缩点 Hex。
        SM2KeyPair keyPair = sm2.generateKeyPair();
        assertEquals(64, keyPair.privateKey().length());
        assertEquals(130, keyPair.publicKey().length());

        // 3. SM2 签名：计算 e = SM3(Z || M)，签名使用 DER，外层使用 Base64。
        SM2SignOptions signOptions = SM2SignOptions.builder()
            .userId(userId)
            .signatureFormat(SM2SignatureFormat.DER)
            .build();
        String signatureBase64 = Base64Codec.encode(
            sm2.sign(keyPair.privateKey(), plaintext, StandardCharsets.UTF_8, signOptions));

        // 4. SM2 验签：显式 Base64 解码，并固定 DER 结构和相同 userId。
        SM2VerifyOptions verifyOptions = SM2VerifyOptions.builder()
            .userId(userId)
            .signatureFormat(SM2SignatureInputFormat.DER)
            .build();
        byte[] signature = Base64Codec.decode(signatureBase64, "SM2 signature");
        assertTrue(sm2.verify(keyPair.publicKey(), plaintext, StandardCharsets.UTF_8, signature, verifyOptions));

        // 5. 篡改断言：金额变化或 userId 变化后，SM2 验签必须返回 false。
        assertFalse(sm2.verify(keyPair.publicKey(), tampered, StandardCharsets.UTF_8, signature, verifyOptions));
        assertFalse(sm2.verify(
            keyPair.publicKey(),
            plaintext,
            StandardCharsets.UTF_8,
            signature,
            SM2VerifyOptions.builder()
                .userId("other@gmkit.cn")
                .signatureFormat(SM2SignatureInputFormat.DER)
                .build()));

        // 6. SM2 加密：文本先按 UTF-8 转为字节，密文固定为 C1C3C2 并使用 Base64 传输。
        byte[] ciphertext = sm2.encrypt(
            keyPair.publicKey(),
            Texts.bytes(plaintext, StandardCharsets.UTF_8),
            SM2CipherMode.C1C3C2);
        String ciphertextBase64 = Base64Codec.encode(ciphertext);

        // 7. SM2 解密：显式 Base64 解码和 C1C3C2，恢复 UTF-8 文本。
        byte[] decrypted = sm2.decrypt(
            keyPair.privateKey(),
            Base64Codec.decode(ciphertextBase64, "SM2 ciphertext"),
            SM2CipherMode.C1C3C2);
        assertEquals(plaintext, Texts.text(decrypted, StandardCharsets.UTF_8));

        // 8. 密文篡改断言：修改 C3/C2 后，SM2 解密必须校验失败并抛错。
        byte[] tamperedCiphertext = ciphertext.clone();
        tamperedCiphertext[tamperedCiphertext.length - 1] ^= 0x01;
        assertThrows(
            GmkitException.class,
            () -> sm2.decrypt(keyPair.privateKey(), tamperedCiphertext, SM2CipherMode.C1C3C2));

        // 9. 公钥压缩往返：压缩点解压后必须恢复同一非压缩公钥。
        String compressedPublicKey = sm2.compressPublicKey(keyPair.publicKey());
        assertEquals(66, compressedPublicKey.length());
        assertEquals(keyPair.publicKey(), sm2.decompressPublicKey(compressedPublicKey));

        // 10. 生成交换密钥：A、B 分别创建长期密钥和本次会话临时密钥。
        SM2KeyPair staticA = sm2.generateKeyPair();
        SM2KeyPair ephemeralA = sm2.generateKeyPair();
        SM2KeyPair staticB = sm2.generateKeyPair();
        SM2KeyPair ephemeralB = sm2.generateKeyPair();

        // 11. 响应方计算：B 先派生 128-bit key，并生成发给 A 的 S1。
        SM2KeyExchangeResult responder = sm2.keyExchangeWithConfirmation(
            staticB.privateKey(),
            ephemeralB.privateKey(),
            staticA.publicKey(),
            ephemeralA.publicKey(),
            SM2KeyExchangeOptions.builder()
                .initiator(false)
                .keyBits(128)
                .selfId("warehouse@gmkit.cn")
                .peerId("merchant@gmkit.cn")
                .build());

        // 12. 发起方计算：A 验证 B 发来的 S1，并生成供 B 验证的 S2。
        SM2KeyExchangeResult initiator = sm2.keyExchangeWithConfirmation(
            staticA.privateKey(),
            ephemeralA.privateKey(),
            staticB.publicKey(),
            ephemeralB.publicKey(),
            SM2KeyExchangeOptions.builder()
                .initiator(true)
                .keyBits(128)
                .selfId("merchant@gmkit.cn")
                .peerId("warehouse@gmkit.cn")
                .confirmationTag(responder.s1())
                .build());

        // 13. 派生密钥断言：双方共享 key 必须相同且长度为 16 字节。
        assertEquals(16, initiator.key().length);
        assertArrayEquals(responder.key(), initiator.key());

        // 14. 确认标签断言：B 必须验证 A 返回的 S2 后才能接受会话。
        assertTrue(sm2.confirmResponder(responder.s2(), initiator.s2()));

        // 15. 身份错误断言：替换响应方身份后，A 对 S1 的验证必须失败。
        assertThrows(
            IllegalStateException.class,
            () -> sm2.keyExchangeWithConfirmation(
                staticA.privateKey(),
                ephemeralA.privateKey(),
                staticB.publicKey(),
                ephemeralB.publicKey(),
                SM2KeyExchangeOptions.builder()
                    .initiator(true)
                    .keyBits(128)
                    .selfId("merchant@gmkit.cn")
                    .peerId("other@gmkit.cn")
                    .confirmationTag(responder.s1())
                    .build()));
    }
}
// #endregion manual-java-sm2
