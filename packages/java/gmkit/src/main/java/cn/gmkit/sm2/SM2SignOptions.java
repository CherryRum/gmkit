package cn.gmkit.sm2;

import cn.gmkit.core.Checks;
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.core.GmSecurityContexts;
import cn.gmkit.core.SM2SignatureFormat;

/**
 * SM2 签名选项。
 * <p>
 * 用于控制签名输出格式、用户标识、是否跳过 Z 值计算以及安全上下文。
 */
public final class SM2SignOptions {

    private final SM2SignatureFormat signatureFormat;
    private final String userId;
    private final boolean skipZComputation;
    private final GmSecurityContext securityContext;

    private SM2SignOptions(Builder builder) {
        this.signatureFormat = builder.signatureFormat;
        this.userId = builder.userId;
        this.skipZComputation = builder.skipZComputation;
        this.securityContext = builder.securityContext;
    }

    /**
     * 创建构建器
     *
     * @return 构建器实例
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * 获取签名输出格式。
     *
     * @return {@link SM2SignatureFormat#RAW} 或 {@link SM2SignatureFormat#DER}；默认 RAW
     */
    public SM2SignatureFormat signatureFormat() {
        return signatureFormat;
    }

    /**
     * 获取用于计算 Z 值的用户标识。
     *
     * @return 用户标识；构建器会将 {@code null} 或空字符串回退为兼容默认值
     */
    public String userId() {
        return userId;
    }

    /**
     * 返回是否启用旧 no-Z 兼容语义。
     *
     * @return 使用 {@code e = SM3(M)} 时返回 {@code true}；默认返回 {@code false}
     * @deprecated 该语义不属于标准 SM2 身份绑定流程，仅用于迁移既有旧协议
     */
    @Deprecated
    public boolean skipZComputation() {
        return skipZComputation;
    }

    /**
     * 获取签名操作使用的 Provider 与安全随机源配置。
     *
     * @return 非空安全上下文；默认使用 {@link GmSecurityContexts#defaults()}
     */
    public GmSecurityContext securityContext() {
        return securityContext;
    }

    /**
     * SM2 签名选项构建器。
     */
    public static final class Builder {
        private SM2SignatureFormat signatureFormat = SM2SignatureFormat.RAW;
        private String userId = SM2.DEFAULT_USER_ID;
        private boolean skipZComputation;
        private GmSecurityContext securityContext = GmSecurityContexts.defaults();

        private Builder() {
        }

        /**
         * 设置签名格式。
         *
         * @param signatureFormat 签名格式；传入 {@code null} 时回退为 {@code RAW}
         * @return 当前构建器
         */
        public Builder signatureFormat(SM2SignatureFormat signatureFormat) {
            this.signatureFormat = Checks.defaultIfNull(signatureFormat, SM2SignatureFormat.RAW);
            return this;
        }

        /**
         * 设置用户标识。
         *
         * @param userId 用户标识；传入 {@code null} 或空字符串时回退为默认用户标识
         * @return 当前构建器
         */
        public Builder userId(String userId) {
            this.userId = userId == null || userId.isEmpty() ? SM2.DEFAULT_USER_ID : userId;
            return this;
        }

        /**
         * 设置是否启用旧 no-Z 兼容语义。
         *
         * @param skipZComputation 为 {@code true} 时计算 {@code e = SM3(M)}；标准 SM2 应保持 {@code false}
         * @return 当前构建器
         * @deprecated 该语义不属于标准 SM2 身份绑定流程，仅用于迁移既有旧协议
         */
        @Deprecated
        public Builder skipZComputation(boolean skipZComputation) {
            this.skipZComputation = skipZComputation;
            return this;
        }

        /**
         * 设置安全上下文。
         *
         * @param securityContext 安全上下文；传入 {@code null} 时回退为默认配置
         * @return 当前构建器
         */
        public Builder securityContext(GmSecurityContext securityContext) {
            this.securityContext = Checks.defaultIfNull(securityContext, GmSecurityContexts.defaults());
            return this;
        }

        /**
         * 构建不可变的签名选项对象。
         *
         * @return SM2 签名选项
         */
        public SM2SignOptions build() {
            return new SM2SignOptions(this);
        }
    }
}
