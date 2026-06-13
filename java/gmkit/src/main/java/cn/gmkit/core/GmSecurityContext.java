package cn.gmkit.core;

import java.security.Provider;
import java.security.SecureRandom;

/**
 * 国密算法安全上下文。
 * <p>
 * 封装 Provider、随机源以及是否自动注册 Provider 等运行时安全配置。
 */
public final class GmSecurityContext {

    private final Provider provider;
    private final SecureRandom secureRandom;
    private final boolean registerProvider;

    private GmSecurityContext(Builder builder) {
        this.provider = Checks.defaultIfNull(builder.provider, BcProviders.defaultProvider());
        this.secureRandom = Checks.defaultIfNull(builder.secureRandom, new SecureRandom());
        this.registerProvider = builder.registerProvider;
    }

    /**
     * 创建安全上下文构建器。
     *
     * @return 构建器实例
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * 获取当前安全上下文对应的 Provider。
     * <p>
     * 当 {@link #registerProvider()} 为 {@code true} 时，此方法会在返回前确保 Provider 已注册。
     *
     * @return Provider 实例
     */
    public Provider provider() {
        if (!registerProvider) {
            return provider;
        }
        return BcProviders.registerIfNeeded(provider);
    }

    /**
     * 获取安全随机数生成器。
     *
     * @return SecureRandom 实例
     */
    public SecureRandom secureRandom() {
        return secureRandom;
    }

    /**
     * 是否在访问 Provider 时自动注册。
     *
     * @return 需要自动注册时返回 {@code true}
     */
    public boolean registerProvider() {
        return registerProvider;
    }

    /**
     * 安全上下文构建器。
     */
    public static final class Builder {
        private Provider provider;
        private SecureRandom secureRandom;
        private boolean registerProvider = true;

        private Builder() {
        }

        /**
         * 设置加密 Provider。
         *
         * @param provider Provider 实例；传入 {@code null} 时在构建时回退为默认 BC Provider
         * @return 当前构建器
         */
        public Builder provider(Provider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * 设置安全随机数生成器。
         *
         * @param secureRandom SecureRandom 实例；传入 {@code null} 时在构建时创建默认实例
         * @return 当前构建器
         */
        public Builder secureRandom(SecureRandom secureRandom) {
            this.secureRandom = secureRandom;
            return this;
        }

        /**
         * 设置是否自动注册 Provider。
         *
         * @param registerProvider 为 {@code true} 时在调用 {@link GmSecurityContext#provider()} 时自动注册
         * @return 当前构建器
         */
        public Builder registerProvider(boolean registerProvider) {
            this.registerProvider = registerProvider;
            return this;
        }

        /**
         * 构建不可变的安全上下文对象。
         *
         * @return 安全上下文
         */
        public GmSecurityContext build() {
            return new GmSecurityContext(this);
        }
    }
}
