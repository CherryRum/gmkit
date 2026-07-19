package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SM9ChecksTest {

    @Test
    void dataRangeShouldRejectOverflowedEndIndex() {
        byte[] data = new byte[8];

        assertThrows(
            SM9Exception.class,
            () -> SM9Checks.requireRange(data, Integer.MAX_VALUE, Integer.MAX_VALUE, "data range"));
    }

    @Test
    void dataRangeShouldAcceptExactArrayBoundary() {
        byte[] data = new byte[8];

        assertDoesNotThrow(() -> SM9Checks.requireRange(data, 3, 5, "data range"));
    }

    @Test
    void nonBlankValidationShouldPreserveIdentityBytes() {
        String id = "  用户-😊\u0000id  ";

        assertEquals(id, SM9Checks.requireNonBlank(id, "id"));
        assertArrayEquals(
            new byte[] {0x20, 0x20, (byte) 0xe7, (byte) 0x94, (byte) 0xa8,
                (byte) 0xe6, (byte) 0x88, (byte) 0xb7, 0x2d,
                (byte) 0xf0, (byte) 0x9f, (byte) 0x98, (byte) 0x8a,
                0x00, 0x69, 0x64, 0x20, 0x20},
            SM9Checks.utf8Bytes(id));
    }

    @Test
    void nativeCStringShouldUseStandardUtf8AndRejectEmbeddedNul() {
        assertArrayEquals(
            new byte[] {(byte) 0xe5, (byte) 0xaf, (byte) 0x86, (byte) 0xe7,
                (byte) 0xa0, (byte) 0x81, 0x2d, (byte) 0xf0, (byte) 0x9f,
                (byte) 0x98, (byte) 0x8a},
            SM9Checks.utf8CString("密码-😊", "password"));
        assertThrows(
            SM9Exception.class,
            () -> SM9Checks.utf8CString("before\0after", "password"));
    }
}
