package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SM9 签名 / 验签功能测试（需要 native 库）。
 */
@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class SM9SignTest {

    private static final byte[] MESSAGE = "Hello GMKit SM9!".getBytes(StandardCharsets.UTF_8);

    @Test
    void signAndVerifyShouldSucceed() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            assertNotNull(signature);
            assertTrue(signature.length > 0);
            assertTrue(SM9.verify(master, "alice@example.com", MESSAGE, signature));
        }
    }

    @Test
    void verifyWithWrongIdShouldFail() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            assertFalse(SM9.verify(master, "bob@example.com", MESSAGE, signature));
        }
    }

    @Test
    void verifyWithTamperedDataShouldFail() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            byte[] tampered = MESSAGE.clone();
            tampered[0] ^= 0x01;
            assertFalse(SM9.verify(master, "alice@example.com", tampered, signature));
        }
    }

    @Test
    void verifyWithTamperedSignatureShouldFail() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            signature[signature.length - 1] ^= 0x01;
            assertFalse(SM9.verify(master, "alice@example.com", MESSAGE, signature));
        }
    }

    @Test
    void blankIdShouldThrow() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            assertThrows(SM9Exception.class, () -> master.extractKey("  "));
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("unicodeMessages")
    void unicodeMessagesShouldSignAndVerify(String name, String message) {
        byte[] data = message.getBytes(StandardCharsets.UTF_8);
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice+unicode@example.com")) {
            byte[] signature = SM9.sign(signKey, data);

            assertNotNull(signature, name);
            assertTrue(SM9.verify(master, "alice+unicode@example.com", data, signature), name);
            assertFalse(SM9.verify(master, "bob+unicode@example.com", data, signature), name);
        }
    }

    private static Stream<Arguments> unicodeMessages() {
        return Stream.of(
            Arguments.of("Chinese punctuation", "你好，GMKit！这是中文测试。"),
            Arguments.of("Emoji", "SM9 签名 😊🚀🔥"),
            Arguments.of("Mixed Unicode", "中文 + emoji 😊 + English + 123"),
            Arguments.of("Newlines and tabs", "第一行\nsecond line\t第三行"),
            Arguments.of("Long text", longMessage()));
    }

    private static String longMessage() {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 20; i++) {
            builder.append("SM9长文本😊");
        }
        return builder.toString();
    }
}
