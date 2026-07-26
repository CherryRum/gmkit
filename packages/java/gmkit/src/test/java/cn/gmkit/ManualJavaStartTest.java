// #region manual-java-start
package cn.gmkit;

import cn.gmkit.core.BcProviders;
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm3.SM3Util;
import org.junit.jupiter.api.Test;

import java.security.Provider;
import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ManualJavaStartTest {

    @Test
    void verifiesProviderRandomAndFixedVector() {
        // 1. 创建 Provider：实例直接传给算法，不修改 JVM 的全局 Provider 顺序。
        Provider provider = BcProviders.create();
        GmSecurityContext context = GmSecurityContext.builder()
            .provider(provider)
            .secureRandom(new SecureRandom())
            .registerProvider(false)
            .build();
        assertFalse(context.registerProvider());
        assertEquals("BC", context.provider().getName());

        // 2. 生成 SM2 密钥：验证 Provider 和 SecureRandom 能完成随机密码操作。
        SM2KeyPair keyPair = new SM2(context).generateKeyPair();
        assertEquals(64, keyPair.privateKey().length());
        assertEquals(130, keyPair.publicKey().length());

        // 3. 计算 SM3 固定向量：SM3("abc") 必须得到标准 32 字节摘要。
        assertEquals(
            "66c7f0f462eeedd9d1f2d46bdc10e4e2"
                + "4167c4875cf2f7a2297da02b8f4ba8e0",
            SM3Util.digestHex("abc"));

        // 4. 随机源断言：安全上下文必须始终提供非空 SecureRandom。
        assertNotNull(context.secureRandom());
    }
}
// #endregion manual-java-start
