package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SM9 流式签名 / 验签测试：多次 {@code update} 处理大数据（需要 native 库）。
 */
@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class SM9StreamingSignTest {

    @Test
    void chunkedUpdateShouldVerify() {
        byte[] data = new byte[200_000];
        new Random(42).nextBytes(data);

        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("stream@example.com")) {

            byte[] signature;
            try (SM9Signature signer = new SM9Signature(true)) {
                feedInChunks(signer, data);
                signature = signer.sign(signKey);
            }
            assertNotNull(signature);

            try (SM9Signature verifier = new SM9Signature(false)) {
                feedInChunks(verifier, data);
                assertTrue(verifier.verify(signature, master, "stream@example.com"));
            }
        }
    }

    @Test
    void resetShouldAllowReuse() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("reuse@example.com");
             SM9Signature signer = new SM9Signature(true)) {

            signer.update("first".getBytes());
            byte[] first = signer.sign(signKey);

            signer.reset(true);
            signer.update("second".getBytes());
            byte[] second = signer.sign(signKey);

            assertNotNull(first);
            assertNotNull(second);
            assertTrue(SM9.verify(master, "reuse@example.com", "second".getBytes(), second));
        }
    }

    private static void feedInChunks(SM9Signature ctx, byte[] data) {
        int chunk = 4096;
        for (int offset = 0; offset < data.length; offset += chunk) {
            int len = Math.min(chunk, data.length - offset);
            ctx.update(data, offset, len);
        }
    }
}
