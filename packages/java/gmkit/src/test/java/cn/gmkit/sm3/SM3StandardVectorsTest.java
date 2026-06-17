package cn.gmkit.sm3;

import cn.gmkit.core.HexCodec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class SM3StandardVectorsTest {

    private static final String EMPTY_VECTOR =
        "1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b";
    private static final String ABC_VECTOR =
        "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0";
    private static final String LONG_VECTOR =
        "debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732";

    private final SM3 sm3 = new SM3();

    @Test
    void digestShouldMatchOfficialVectors() {
        assertEquals(EMPTY_VECTOR, sm3.digestHex(""));
        assertEquals(ABC_VECTOR, sm3.digestHex("abc"));
        assertEquals(LONG_VECTOR, sm3.digestHex("abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"));
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({
        "ASCII, hello gmkit, 3425c540fb7b120f9c585786c53fba004f151ff207edcd58f1cfff18857e034a",
        "Chinese, 你好，国密, d5a98f677223c159be053eb1eb74886daa87455fdbcdd1b34551caa83f0332d1",
        "Emoji, 国密测试 😊🚀🔥, 25007eb85ec568fdc5f8acd881c1520b9e5ca48871d432ec61226fd5f42cfed5",
        "Mixed Unicode, 中文 + emoji 😊 + English + 123, 2c0fba270ed6a572d05d21a138009376e479825d746d361bcd4a583adfa8145d",
        "Spaces, '  前后空格\tspaces  ', 0e1bf25b76bd2ba2a006cb30f7fbd6eb237beca41956b3dd465b05740def94ea",
        "Symbols, 'SM2/SM3/SM4/ZUC: !@#$%^&*()_+-=[]{}|;:,.<>?', 26967d98e958ba5e7a957706ebdffcb0fd104343689129dcf524ba5fd683d59b"
    })
    void unicodeProjectVectorsShouldMatchTypeScript(String name, String message, String expectedDigest) {
        assertEquals(expectedDigest, sm3.digestHex(message), name);
    }

    @Test
    void multilineAndLongUnicodeShouldMatchTypeScriptProjectVectors() {
        assertEquals(
            "75e37ae3b6bc3f60887d09f365d7380a5c034b83233fd65ef89cb5cd78584ec1",
            sm3.digestHex("第一行\nsecond line\t第三行"));

        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 80; i++) {
            builder.append("国密长文本😊");
        }
        assertEquals(
            "f262f8465a4f8a06b90b884600f3cb12533e6309d90c5db68c7863bb917518be",
            sm3.digestHex(builder.toString()));
    }

    @Test
    void digestShouldShowAvalancheEffectForSmallInputChange() {
        byte[] left = sm3.digest("abc");
        byte[] right = sm3.digest("abd");

        assertNotEquals(HexCodec.encode(left), HexCodec.encode(right));
        assertTrue(hammingDistance(left, right) > 100);
    }

    private static int hammingDistance(byte[] left, byte[] right) {
        int distance = 0;
        for (int i = 0; i < left.length; i++) {
            distance += Integer.bitCount((left[i] ^ right[i]) & 0xff);
        }
        return distance;
    }
}
