package cn.gmkit.sm2;

import cn.gmkit.core.GmSecurityContexts;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.core.SM2SignatureInputFormat;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SM2ContractsTest {

    @Test
    void signOptionsShouldFallbackToDefaultsForNullValues() {
        SM2SignOptions options = SM2SignOptions.builder()
            .signatureFormat(null)
            .userId(null)
            .securityContext(null)
            .build();

        assertEquals(SM2SignatureFormat.RAW, options.signatureFormat());
        assertEquals(SM2.DEFAULT_USER_ID, options.userId());
        assertFalse(options.skipZComputation());
        assertSame(GmSecurityContexts.defaults(), options.securityContext());
    }

    @Test
    void verifyOptionsShouldFallbackToDefaultsForNullValues() {
        SM2VerifyOptions options = SM2VerifyOptions.builder()
            .signatureFormat(null)
            .userId(null)
            .build();

        assertEquals(SM2SignatureInputFormat.AUTO, options.signatureFormat());
        assertEquals(SM2.DEFAULT_USER_ID, options.userId());
        assertFalse(options.skipZComputation());
    }

    @Test
    void keyExchangeOptionsShouldFallbackToDefaultsAndDefensivelyCopyConfirmationTag() {
        byte[] confirmationTag = HexCodec.decodeStrict("01020304", "confirmationTag");
        byte[] original = confirmationTag.clone();
        SM2KeyExchangeOptions options = SM2KeyExchangeOptions.builder()
            .selfId(null)
            .peerId(null)
            .confirmationTag(confirmationTag)
            .build();

        confirmationTag[0] ^= 0x01;
        assertFalse(options.initiator());
        assertEquals(128, options.keyBits());
        assertEquals(SM2.DEFAULT_USER_ID, options.selfId());
        assertEquals(SM2.DEFAULT_USER_ID, options.peerId());
        assertArrayEquals(original, options.confirmationTag());

        byte[] returned = options.confirmationTag();
        returned[1] ^= 0x01;
        assertArrayEquals(original, options.confirmationTag());
    }

    @Test
    void ciphertextAndKeyExchangeResultShouldDefensivelyCopyArrays() {
        byte[] c1 = HexCodec.decodeStrict(
            "04"
                + "609EA50E3212338AB9074492175300724BA2ACEC5DADAA26A0188CE426BE5769"
                + "7D5C8ECDA528D93EA689D5F4975508694299129C1AE6B2D10B11E9BE0CEF8C1B",
            "c1");
        byte[] c2 = HexCodec.decodeStrict("01020304", "c2");
        byte[] c3 = HexCodec.decodeStrict(
            "66C7F0F462EEEDD9D1F2D46BDC10E4E24167C4875CF2F7A2297DA02B8F4BA8E0",
            "c3");
        SM2Ciphertext ciphertext = new SM2Ciphertext(c1, c2, c3, SM2CipherMode.C1C3C2);

        c1[1] ^= 0x01;
        c2[0] ^= 0x01;
        c3[0] ^= 0x01;
        assertEquals(0x04, ciphertext.c1()[0]);
        assertArrayEquals(HexCodec.decodeStrict("01020304", "c2"), ciphertext.c2());
        assertArrayEquals(
            HexCodec.decodeStrict("66C7F0F462EEEDD9D1F2D46BDC10E4E24167C4875CF2F7A2297DA02B8F4BA8E0", "c3"),
            ciphertext.c3());

        byte[] key = HexCodec.decodeStrict("00112233445566778899AABBCCDDEEFF", "key");
        byte[] s1 = HexCodec.decodeStrict("0102030405060708", "s1");
        byte[] s2 = HexCodec.decodeStrict("1112131415161718", "s2");
        SM2KeyExchangeResult result = new SM2KeyExchangeResult(key, s1, s2);

        key[0] ^= 0x01;
        s1[0] ^= 0x01;
        s2[0] ^= 0x01;
        assertEquals("00112233445566778899aabbccddeeff", result.keyHex());
        assertEquals("0102030405060708", result.s1Hex());
        assertEquals("1112131415161718", result.s2Hex());

        byte[] returnedKey = result.key();
        returnedKey[0] ^= 0x01;
        assertEquals("00112233445566778899aabbccddeeff", result.keyHex());
    }
}
