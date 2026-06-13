package cn.gmkit.core;

import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.security.Provider;
import java.security.Security;

/**
 * BouncyCastle Provider 辅助工具。
 * <p>
 * 负责创建、探测与按需注册 BC Provider，供 SM2、SM3、SM4 模块共享使用。
 */
public final class BcProviders {

    private static final Object LOCK = new Object();

    private BcProviders() {
    }

    /**
     * 创建一个新的 BouncyCastle Provider 实例。
     *
     * @return 新的 BC Provider
     */
    public static Provider create() {
        return new BouncyCastleProvider();
    }

    /**
     * 获取当前 JVM 中已注册的 BouncyCastle Provider。
     *
     * @return 已注册的 BC Provider；未注册时返回 {@code null}
     */
    public static Provider getIfPresent() {
        return Security.getProvider(BouncyCastleProvider.PROVIDER_NAME);
    }

    /**
     * 获取默认 Provider。
     * <p>
     * 如果当前 JVM 尚未注册 BC，则返回一个新的未注册实例。
     *
     * @return 可用于当前调用的 BC Provider
     */
    public static Provider defaultProvider() {
        Provider provider = getIfPresent();
        return provider != null ? provider : create();
    }

    /**
     * 确保默认的 BouncyCastle Provider 已注册。
     *
     * @return 已注册的 BC Provider
     */
    public static Provider ensureRegistered() {
        Provider provider = getIfPresent();
        if (provider != null) {
            return provider;
        }
        synchronized (LOCK) {
            provider = getIfPresent();
            if (provider != null) {
                return provider;
            }
            Provider created = create();
            Security.addProvider(created);
            Provider registered = getIfPresent();
            return registered != null ? registered : created;
        }
    }

    /**
     * 在必要时注册指定 Provider。
     *
     * @param provider 待注册 Provider
     * @return JVM 中最终可用的 Provider 实例
     */
    public static Provider registerIfNeeded(Provider provider) {
        Provider existing = Security.getProvider(provider.getName());
        if (existing != null) {
            return existing;
        }
        synchronized (LOCK) {
            existing = Security.getProvider(provider.getName());
            if (existing != null) {
                return existing;
            }
            Security.addProvider(provider);
            Provider registered = Security.getProvider(provider.getName());
            return registered != null ? registered : provider;
        }
    }
}

