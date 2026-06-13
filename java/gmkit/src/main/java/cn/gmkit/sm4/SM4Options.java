package cn.gmkit.sm4;

import cn.gmkit.core.*;

/**
 * SM4 配置项。
 * <p>
 * 同一对象同时用于加密和解密。对 GCM/CCM 解密，认证标签通过 {@link #tag()} 提供。
 */
public final class SM4Options {

    private final SM4CipherMode mode;
    private final SM4Padding padding;
    private final byte[] iv;
    private final byte[] aad;
    private final Integer tagLength;
    private final byte[] tag;
    private final GmSecurityContext securityContext;

    private SM4Options(Builder builder) {
        this.mode = builder.mode;
        this.padding = builder.padding;
        this.iv = Bytes.clone(builder.iv);
        this.aad = Bytes.clone(builder.aad);
        this.tagLength = builder.tagLength;
        this.tag = Bytes.clone(builder.tag);
        this.securityContext = builder.securityContext;
    }

    /**
     * 创建构建器。
     *
     * @return 构建器实例
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * 获取工作模式，默认值为 {@code ECB}。
     *
     * @return SM4 工作模式
     */
    public SM4CipherMode mode() {
        return mode;
    }

    /**
     * 获取填充模式，默认值为 {@code PKCS7}。
     *
     * @return 填充策略
     */
    public SM4Padding padding() {
        return padding;
    }

    /**
     * 获取 IV 或 nonce。
     *
     * @return IV/nonce 的防御性拷贝，未设置时返回 {@code null}
     */
    public byte[] iv() {
        return Bytes.clone(iv);
    }

    byte[] ivUnsafe() {
        return iv;
    }

    /**
     * 获取 AEAD 附加认证数据。
     *
     * @return AAD 的防御性拷贝，未设置时返回 {@code null}
     */
    public byte[] aad() {
        return Bytes.clone(aad);
    }

    byte[] aadUnsafe() {
        return aad;
    }

    /**
     * 获取认证标签长度，单位为字节。
     *
     * @return 标签长度，未显式配置时返回 {@code null}
     */
    public Integer tagLength() {
        return tagLength;
    }

    /**
     * 获取解密使用的认证标签。
     *
     * @return 标签的防御性拷贝，未设置时返回 {@code null}
     */
    public byte[] tag() {
        return Bytes.clone(tag);
    }

    byte[] tagUnsafe() {
        return tag;
    }

    /**
     * 获取安全上下文。
     *
     * @return 加密 Provider 与随机源配置
     */
    public GmSecurityContext securityContext() {
        return securityContext;
    }

    /**
     * 是否显式配置了认证标签。
     *
     * @return 配置了标签时返回 {@code true}
     */
    public boolean hasTag() {
        return cn.gmkit.core.Checks.hasBytes(tag);
    }

    /**
     * SM4 配置构建器。
     */
    public static final class Builder {
        private SM4CipherMode mode = SM4CipherMode.ECB;
        private SM4Padding padding = SM4Padding.PKCS7;
        private byte[] iv;
        private byte[] aad;
        private Integer tagLength;
        private byte[] tag;
        private GmSecurityContext securityContext = GmSecurityContexts.defaults();

        private Builder() {
        }

        /**
         * 设置工作模式。
         *
         * @param mode 工作模式，传入 {@code null} 时回退为 {@code ECB}
         * @return 当前构建器
         */
        public Builder mode(SM4CipherMode mode) {
            this.mode = cn.gmkit.core.Checks.defaultIfNull(mode, SM4CipherMode.ECB);
            return this;
        }

        /**
         * 设置填充模式。
         *
         * @param padding 填充模式，传入 {@code null} 时回退为 {@code PKCS7}
         * @return 当前构建器
         */
        public Builder padding(SM4Padding padding) {
            this.padding = cn.gmkit.core.Checks.defaultIfNull(padding, SM4Padding.PKCS7);
            return this;
        }

        /**
         * 设置 IV 或 nonce。
         *
         * @param iv IV 或 nonce
         * @return 当前构建器
         */
        public Builder iv(byte[] iv) {
            this.iv = Bytes.clone(iv);
            return this;
        }

        /**
         * 设置附加认证数据。
         *
         * @param aad 附加认证数据
         * @return 当前构建器
         */
        public Builder aad(byte[] aad) {
            this.aad = Bytes.clone(aad);
            return this;
        }

        /**
         * 设置认证标签长度，单位为字节。
         *
         * @param tagLength 标签长度
         * @return 当前构建器
         */
        public Builder tagLength(Integer tagLength) {
            this.tagLength = tagLength;
            return this;
        }

        /**
         * 设置解密使用的认证标签。
         *
         * @param tag 认证标签
         * @return 当前构建器
         */
        public Builder tag(byte[] tag) {
            this.tag = Bytes.clone(tag);
            return this;
        }

        /**
         * 设置安全上下文。
         *
         * @param securityContext 安全上下文，传入 {@code null} 时回退为默认配置
         * @return 当前构建器
         */
        public Builder securityContext(GmSecurityContext securityContext) {
            this.securityContext = cn.gmkit.core.Checks.defaultIfNull(securityContext, GmSecurityContexts.defaults());
            return this;
        }

        /**
         * 构建不可变配置对象。
         *
         * @return SM4 配置实例
         */
        public SM4Options build() {
            return new SM4Options(this);
        }
    }
}
