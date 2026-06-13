package cn.gmkit.sm2;

import cn.gmkit.core.Checks;
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.core.GmSecurityContexts;
import cn.gmkit.core.SM2SignatureFormat;
import lombok.Getter;
import lombok.experimental.Accessors;

/**
 * SM2 签名选项。
 * <p>
 * 用于控制签名输出格式、用户标识、是否跳过 Z 值计算以及安全上下文。
 */
@Getter
@Accessors(fluent = true)
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
         * @param userId 用户标识；传入 {@code null} 时回退为默认用户标识
         * @return 当前构建器
         */
        public Builder userId(String userId) {
            this.userId = Checks.defaultIfNull(userId, SM2.DEFAULT_USER_ID);
            return this;
        }

        /**
         * 设置是否跳过 Z 值计算。
         *
         * @param skipZComputation 为 {@code true} 时，直接对消息摘要后的 e 值签名
         * @return 当前构建器
         */
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
