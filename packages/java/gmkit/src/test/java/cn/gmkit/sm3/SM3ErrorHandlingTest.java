package cn.gmkit.sm3;

import cn.gmkit.core.GmkitException;
import cn.gmkit.core.Messages;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SM3ErrorHandlingTest {

    private final SM3 sm3 = new SM3();

    @Test
    void digestShouldRejectNullInput() {
        GmkitException exception = assertThrows(GmkitException.class, () -> sm3.digest((byte[]) null));
        assertEquals(Messages.nullValue("SM3 input"), exception.getMessage());
    }

    @Test
    void hmacShouldRejectNullKey() {
        GmkitException exception = assertThrows(GmkitException.class, () -> sm3.hmac(null, new byte[]{1}));
        assertEquals(
            Messages.bilingual("SM3 HMAC 密钥和输入都不能为空", "SM3 HMAC key and input must not be null"),
            exception.getMessage());
    }

    @Test
    void hmacShouldRejectNullInput() {
        GmkitException exception = assertThrows(GmkitException.class, () -> sm3.hmac(new byte[]{1}, (byte[]) null));
        assertEquals(
            Messages.bilingual("SM3 HMAC 密钥和输入都不能为空", "SM3 HMAC key and input must not be null"),
            exception.getMessage());
    }
}
