package cn.gmkit.sm4;

import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SM4ContractsTest {

    @Test
    void optionsShouldDefensivelyCopyArrayFields() {
        byte[] iv = HexCodec.decodeStrict("000102030405060708090A0B0C0D0E0F", "iv");
        byte[] aad = HexCodec.decodeStrict("001122334455", "aad");
        byte[] tag = HexCodec.decodeStrict("AABBCCDDEEFF00112233445566778899", "tag");
        byte[] originalIv = iv.clone();
        byte[] originalAad = aad.clone();
        byte[] originalTag = tag.clone();
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.PKCS7)
            .iv(iv)
            .aad(aad)
            .tag(tag)
            .build();

        iv[0] ^= 0x01;
        aad[0] ^= 0x01;
        tag[0] ^= 0x01;
        assertArrayEquals(originalIv, options.iv());
        assertArrayEquals(originalAad, options.aad());
        assertArrayEquals(originalTag, options.tag());

        byte[] returnedIv = options.iv();
        byte[] returnedAad = options.aad();
        byte[] returnedTag = options.tag();
        returnedIv[1] ^= 0x01;
        returnedAad[1] ^= 0x01;
        returnedTag[1] ^= 0x01;
        assertArrayEquals(originalIv, options.iv());
        assertArrayEquals(originalAad, options.aad());
        assertArrayEquals(originalTag, options.tag());
    }

    @Test
    void cipherResultShouldDefensivelyCopyArrays() {
        byte[] ciphertext = HexCodec.decodeStrict("00112233445566778899AABBCCDDEEFF", "ciphertext");
        byte[] tag = HexCodec.decodeStrict("AABBCCDDEEFF00112233445566778899", "tag");
        SM4CipherResult result = new SM4CipherResult(ciphertext, tag);

        ciphertext[0] ^= 0x01;
        tag[0] ^= 0x01;
        assertEquals("00112233445566778899aabbccddeeff", result.ciphertextHex());
        assertEquals("aabbccddeeff00112233445566778899", result.tagHex());

        byte[] returnedCiphertext = result.ciphertext();
        byte[] returnedTag = result.tag();
        returnedCiphertext[1] ^= 0x01;
        returnedTag[1] ^= 0x01;
        assertEquals("00112233445566778899aabbccddeeff", result.ciphertextHex());
        assertEquals("aabbccddeeff00112233445566778899", result.tagHex());
    }
}
