package cn.gmkit.core;

import java.security.Provider;
import java.security.SecureRandom;

/**
 * 常用安全上下文工厂。
 * <p>
 * 提供默认上下文以及基于 Provider、随机源快速派生安全上下文的便捷方法。
 */
public final class GmSecurityContexts {

    private static final GmSecurityContext DEFAULT_CONTEXT = GmSecurityContext.builder()
        .provider(BcProviders.defaultProvider())
        .registerProvider(true)
        .build();

    private GmSecurityContexts() {
    }

    /**
     * 获取默认安全上下文。
     *
     * @return 默认安全上下文
     */
    public static GmSecurityContext defaults() {
        return DEFAULT_CONTEXT;
    }

    /**
     * 创建绑定指定 Provider 的安全上下文。
     *
     * @param provider Provider 实例
     * @return 安全上下文
     */
    public static GmSecurityContext withProvider(Provider provider) {
        return GmSecurityContext.builder()
            .provider(provider)
            .registerProvider(false)
            .build();
    }

    /**
     * 创建绑定指定 Provider 和随机源的安全上下文。
     *
     * @param provider Provider 实例
     * @param secureRandom SecureRandom 实例
     * @return 安全上下文
     */
    public static GmSecurityContext withProviderAndRandom(Provider provider, SecureRandom secureRandom) {
        return GmSecurityContext.builder()
            .provider(provider)
            .secureRandom(secureRandom)
            .registerProvider(false)
            .build();
    }

    /**
     * 创建绑定指定随机源的安全上下文。
     *
     * @param secureRandom SecureRandom 实例
     * @return 安全上下文
     */
    public static GmSecurityContext withSecureRandom(SecureRandom secureRandom) {
        return GmSecurityContext.builder()
            .provider(BcProviders.defaultProvider())
            .secureRandom(secureRandom)
            .registerProvider(true)
            .build();
    }
}

