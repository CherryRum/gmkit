package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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
}
