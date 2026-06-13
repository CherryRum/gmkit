package cn.gmkit.zuc;

import cn.gmkit.core.GmkitException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ZUCErrorHandlingTest {

    private static final String KEY_HEX = "00112233445566778899aabbccddeeff";
    private static final String IV_HEX = "ffeeddccbbaa99887766554433221100";

    @Test
    void shouldRejectInvalidKeyAndIvLength() {
        assertThrows(GmkitException.class, () -> ZUC.encrypt(new byte[15], new byte[16], new byte[1]));
        assertThrows(GmkitException.class, () -> ZUC.encrypt(new byte[16], new byte[15], new byte[1]));
        assertThrows(GmkitException.class, () -> ZUC.encryptHex(KEY_HEX.substring(2), IV_HEX, "payload"));
        assertThrows(GmkitException.class, () -> ZUC.encryptHex(KEY_HEX, IV_HEX.substring(2), "payload"));
    }

    @Test
    void shouldRejectInvalidHexAndBase64Inputs() {
        assertThrows(GmkitException.class, () -> ZUC.keystreamHex("abc", IV_HEX, 1));
        assertThrows(GmkitException.class, () -> ZUC.keystreamHex(KEY_HEX, "not-hex", 1));
        assertThrows(GmkitException.class, () -> ZUC.decryptHexToUtf8(KEY_HEX, IV_HEX, "xyz"));
        assertThrows(GmkitException.class, () -> ZUC.decryptBase64ToUtf8(KEY_HEX, IV_HEX, "***"));
    }

    @Test
    void shouldRejectNegativeLengths() {
        GmkitException bytes = assertThrows(GmkitException.class, () -> ZUC.keystream(new byte[16], new byte[16], -1));
        GmkitException words = assertThrows(GmkitException.class, () -> ZUC.keystreamWords(new byte[16], new byte[16], -1));
        GmkitException bits = assertThrows(GmkitException.class, () -> ZUC.eea3(KEY_HEX, 0, 0, 0, -1));

        assertTrue(bytes.getMessage().contains("must not be negative"));
        assertTrue(words.getMessage().contains("must not be negative"));
        assertTrue(bits.getMessage().contains("must not be negative"));
    }

    @Test
    void shouldRejectNullPayloads() {
        assertThrows(GmkitException.class, () -> ZUC.encrypt(new byte[16], new byte[16], null));
        assertThrows(GmkitException.class, () -> ZUC.decrypt(new byte[16], new byte[16], null));
        assertThrows(GmkitException.class, () -> ZUC.eia3(KEY_HEX, 0, 0, 0, (byte[]) null));
    }

    @Test
    void shouldRejectInvalidEea3AndEia3Parameters() {
        assertThrows(GmkitException.class, () -> ZUC.eea3(KEY_HEX, 0, -1, 0, 32));
        assertThrows(GmkitException.class, () -> ZUC.eea3(KEY_HEX, 0, 32, 0, 32));
        assertThrows(GmkitException.class, () -> ZUC.eea3(KEY_HEX, 0, 1, 2, 32));
        assertThrows(GmkitException.class, () -> ZUC.eia3(KEY_HEX, 0, -1, 0, "payload"));
        assertThrows(GmkitException.class, () -> ZUC.eia3(KEY_HEX, 0, 1, 2, "payload"));
    }
}
