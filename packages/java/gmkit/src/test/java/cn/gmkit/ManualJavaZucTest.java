// #region manual-java-zuc
package cn.gmkit;

import cn.gmkit.core.GmkitException;
import cn.gmkit.core.HexCodec;
import cn.gmkit.zuc.ZUC;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ManualJavaZucTest {

    @Test
    void distinguishesBytesWordsAndBits() {
        // 1. 准备参数：ZUC-128 key 和 IV 都固定为 16 字节 Hex。
        String keyHex = "00000000000000000000000000000000";
        String ivHex = "00000000000000000000000000000000";
        byte[] key = HexCodec.decodeStrict(keyHex, "ZUC key");
        byte[] iv = HexCodec.decodeStrict(ivHex, "ZUC IV");
        byte[] plaintext = "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);

        // 2. 生成密钥流：8 byte 输出与 2 个 32-bit word 输出包含相同的前 8 字节。
        assertEquals("27bede74018082da", ZUC.keystreamHex(keyHex, ivHex, 8));
        assertEquals("27bede74018082da", ZUC.keystreamWordsHex(keyHex, ivHex, 2));

        // 3. ZUC 加密：明文字节与密钥流异或得到等长密文。
        byte[] ciphertext = ZUC.encrypt(key, iv, plaintext);
        assertEquals(plaintext.length, ciphertext.length);

        // 4. ZUC 解密：使用相同 key 和 IV 再次异或，恢复原始字节。
        byte[] decrypted = ZUC.decrypt(key, iv, ciphertext);
        assertArrayEquals(plaintext, decrypted);

        // 5. EEA3 机密性运算：COUNT、BEARER、DIRECTION 与 bitLength 属于协议字段。
        int count = 0x398a59b4;
        int bearer = 0x15;
        int direction = 1;
        int bitLength = plaintext.length * 8;
        byte[] eea3Ciphertext = ZUC.eea3Encrypt(
            keyHex, count, bearer, direction, plaintext, bitLength);

        // 6. EEA3 解密：流密码重复执行同一运算，恢复原始消息字节。
        byte[] eea3Decrypted = ZUC.eea3Encrypt(
            keyHex, count, bearer, direction, eea3Ciphertext, bitLength);
        assertArrayEquals(plaintext, eea3Decrypted);

        // 7. EIA3 完整性校验：相同协议字段和消息产生相同的 32-bit MAC-I。
        String mac = ZUC.eia3(keyHex, count, bearer, direction, plaintext, bitLength);
        assertEquals(8, mac.length());
        assertEquals(mac, ZUC.eia3(keyHex, count, bearer, direction, plaintext, bitLength));

        // 8. 篡改断言：金额变化后 EIA3 MAC-I 必须不同。
        byte[] tampered = "order=GMKIT-DEMO-0001&amount=99.00".getBytes(StandardCharsets.UTF_8);
        assertNotEquals(
            mac,
            ZUC.eia3(keyHex, count, bearer, direction, tampered, tampered.length * 8));

        // 9. 非法参数断言：BEARER 超出 5 bit 范围时必须抛出 GmkitException。
        assertThrows(
            GmkitException.class,
            () -> ZUC.eia3(keyHex, count, 32, direction, plaintext, bitLength));
    }
}
// #endregion manual-java-zuc
