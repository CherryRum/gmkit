package cn.gmkit.sm2;

import cn.gmkit.core.Checks;
import cn.gmkit.core.SM2SignatureInputFormat;
import lombok.Getter;
import lombok.experimental.Accessors;

/**
 * SM2 验签选项。
 * <p>
 * 用于指定签名输入格式、用户标识以及是否跳过 Z 值计算。
 */
@Getter
@Accessors(fluent = true)
public final class SM2VerifyOptions {

    private final SM2SignatureInputFormat signatureFormat;
    private final String userId;
    private final boolean skipZComputation;

    private SM2VerifyOptions(Builder builder) {
        this.signatureFormat = builder.signatureFormat;
        this.userId = builder.userId;
        this.skipZComputation = builder.skipZComputation;
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
     * SM2 验签选项构建器。
     */
    public static final class Builder {
        private SM2SignatureInputFormat signatureFormat = SM2SignatureInputFormat.AUTO;
        private String userId = SM2.DEFAULT_USER_ID;
        private boolean skipZComputation;

        private Builder() {
        }

        /**
         * 设置签名输入格式。
         *
         * @param signatureFormat 签名输入格式；传入 {@code null} 时回退为 {@code AUTO}
         * @return 当前构建器
         */
        public Builder signatureFormat(SM2SignatureInputFormat signatureFormat) {
            this.signatureFormat = Checks.defaultIfNull(signatureFormat, SM2SignatureInputFormat.AUTO);
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
         * @param skipZComputation 为 {@code true} 时按直接 e 值语义验签
         * @return 当前构建器
         */
        public Builder skipZComputation(boolean skipZComputation) {
            this.skipZComputation = skipZComputation;
            return this;
        }

        /**
         * 构建不可变的验签选项对象。
         *
         * @return SM2 验签选项
         */
        public SM2VerifyOptions build() {
            return new SM2VerifyOptions(this);
        }
    }
}
