package cn.gmkit.sm2;

import cn.gmkit.core.Bytes;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.Accessors;

/**
 * SM2 密钥交换选项。
 * <p>
 * 用于控制协商角色、输出密钥位数、双方用户标识以及确认标签。
 */
@Getter
@Accessors(fluent = true)
public final class SM2KeyExchangeOptions {

    private final boolean initiator;
    private final int keyBits;
    private final String selfId;
    private final String peerId;
    @Getter(AccessLevel.NONE)
    private final byte[] confirmationTag;

    private SM2KeyExchangeOptions(Builder builder) {
        this.initiator = builder.initiator;
        this.keyBits = builder.keyBits;
        this.selfId = builder.selfId;
        this.peerId = builder.peerId;
        this.confirmationTag = Bytes.clone(builder.confirmationTag);
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
     * 获取对端确认标签。
     *
     * @return 确认标签的防御性拷贝；未设置时返回 {@code null}
     */
    public byte[] confirmationTag() {
        return Bytes.clone(confirmationTag);
    }

    /**
     * SM2 密钥交换选项构建器。
     */
    public static final class Builder {
        private boolean initiator;
        private int keyBits = 128;
        private String selfId = SM2.DEFAULT_USER_ID;
        private String peerId = SM2.DEFAULT_USER_ID;
        private byte[] confirmationTag;

        private Builder() {
        }

        /**
         * 设置是否为发起方。
         *
         * @param initiator 为 {@code true} 时表示当前一方是协商发起者
         * @return 当前构建器
         */
        public Builder initiator(boolean initiator) {
            this.initiator = initiator;
            return this;
        }

        /**
         * 设置输出密钥位数。
         *
         * @param keyBits 输出密钥位数
         * @return 当前构建器
         */
        public Builder keyBits(int keyBits) {
            this.keyBits = keyBits;
            return this;
        }

        /**
         * 设置己方用户标识。
         *
         * @param selfId 己方用户标识；传入 {@code null} 时回退为默认用户标识
         * @return 当前构建器
         */
        public Builder selfId(String selfId) {
            this.selfId = cn.gmkit.core.Checks.defaultIfNull(selfId, SM2.DEFAULT_USER_ID);
            return this;
        }

        /**
         * 设置对方用户标识。
         *
         * @param peerId 对方用户标识；传入 {@code null} 时回退为默认用户标识
         * @return 当前构建器
         */
        public Builder peerId(String peerId) {
            this.peerId = cn.gmkit.core.Checks.defaultIfNull(peerId, SM2.DEFAULT_USER_ID);
            return this;
        }

        /**
         * 设置对端确认标签。
         *
         * @param confirmationTag 对端确认标签
         * @return 当前构建器
         */
        public Builder confirmationTag(byte[] confirmationTag) {
            this.confirmationTag = Bytes.clone(confirmationTag);
            return this;
        }

        /**
         * 构建不可变的密钥交换选项对象。
         *
         * @return SM2 密钥交换选项
         */
        public SM2KeyExchangeOptions build() {
            return new SM2KeyExchangeOptions(this);
        }
    }
}
