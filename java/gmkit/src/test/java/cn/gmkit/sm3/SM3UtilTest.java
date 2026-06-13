package cn.gmkit.sm3;

import cn.gmkit.core.HexCodec;
import cn.gmkit.core.Texts;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class SM3UtilTest {

    private static final String MESSAGE = "hello";
    private static final byte[] MESSAGE_BYTES = Texts.utf8(MESSAGE);
    private static final byte[] KEY = Texts.utf8("secret");

    @Test
    void digestMethodsShouldMatchObjectEntryPoint() {
        SM3 sm3 = new SM3();

        assertArrayEquals(sm3.digest(MESSAGE_BYTES), SM3Util.digest(MESSAGE_BYTES));
        assertArrayEquals(sm3.digest(MESSAGE), SM3Util.digest(MESSAGE));
        assertEquals(sm3.digestHex(MESSAGE), SM3Util.digestHex(MESSAGE));
        assertEquals(sm3.digestBase64(MESSAGE), SM3Util.digestBase64(MESSAGE));
    }

    @Test
    void hmacMethodsShouldMatchObjectEntryPoint() {
        SM3 sm3 = new SM3();

        assertArrayEquals(sm3.hmac(KEY, MESSAGE_BYTES), SM3Util.hmac(KEY, MESSAGE_BYTES));
        assertArrayEquals(sm3.hmac(KEY, MESSAGE), SM3Util.hmac(KEY, MESSAGE));
        assertEquals(sm3.hmacHex(KEY, MESSAGE), SM3Util.hmacHex(KEY, MESSAGE));
        assertEquals(sm3.hmacBase64(KEY, MESSAGE), SM3Util.hmacBase64(KEY, MESSAGE));
        assertNotEquals(HexCodec.encode(SM3Util.digest(MESSAGE)), HexCodec.encode(SM3Util.hmac(KEY, MESSAGE)));
    }

    @Test
    void charsetAwareUtilMethodsShouldMatchObjectEntryPoint() {
        SM3 sm3 = new SM3();

        assertArrayEquals(
            sm3.digest(MESSAGE, StandardCharsets.UTF_16LE),
            SM3Util.digest(MESSAGE, StandardCharsets.UTF_16LE));
        assertEquals(
            sm3.digestHex(MESSAGE, StandardCharsets.UTF_16LE),
            SM3Util.digestHex(MESSAGE, StandardCharsets.UTF_16LE));
        assertArrayEquals(
            sm3.hmac(KEY, MESSAGE, StandardCharsets.UTF_16LE),
            SM3Util.hmac(KEY, MESSAGE, StandardCharsets.UTF_16LE));
        assertEquals(
            sm3.hmacBase64(KEY, MESSAGE, StandardCharsets.UTF_16LE),
            SM3Util.hmacBase64(KEY, MESSAGE, StandardCharsets.UTF_16LE));
    }
}
