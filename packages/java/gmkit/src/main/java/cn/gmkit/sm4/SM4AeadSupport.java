package cn.gmkit.sm4;

import cn.gmkit.core.*;

final class SM4AeadSupport {

    private SM4AeadSupport() {
    }

    static SM4CipherResult splitCiphertextAndTag(SM4CipherMode mode, byte[] encrypted, int tagLength) {
        if (mode != SM4CipherMode.GCM && mode != SM4CipherMode.CCM) {
            return new SM4CipherResult(encrypted, null);
        }
        if (encrypted.length < tagLength) {
            throw new GmkitException(Messages.bilingual(
                "加密输出长度小于请求的 tag 长度",
                "Encrypted output is shorter than requested tag length"));
        }
        int cipherLength = encrypted.length - tagLength;
        byte[] ciphertext = new byte[cipherLength];
        byte[] tag = new byte[tagLength];
        System.arraycopy(encrypted, 0, ciphertext, 0, cipherLength);
        System.arraycopy(encrypted, cipherLength, tag, 0, tagLength);
        return new SM4CipherResult(ciphertext, tag);
    }

    static byte[] appendTagIfNeeded(byte[] ciphertext, byte[] tag, SM4CipherMode mode, int tagLength) {
        byte[] safeCiphertext = Bytes.requireNonNull(ciphertext, "Ciphertext");
        if (mode != SM4CipherMode.GCM && mode != SM4CipherMode.CCM) {
            return safeCiphertext;
        }
        if (!Checks.hasBytes(tag)) {
            throw new GmkitException(Messages.bilingual(
                "SM4 " + mode.name() + " 解密必须提供认证 tag，请通过 SM4Options.tag(...) 设置",
                "SM4 " + mode.name() + " decryption requires an authentication tag; set it via SM4Options.tag(...)"));
        }
        if (tag.length != tagLength) {
            throw new GmkitException(Messages.bilingual(
                "SM4 " + mode.name() + " 认证 tag 长度无效，应为 " + tagLength + " 字节",
                "Invalid SM4 " + mode.name() + " authentication tag length: expected " + tagLength + " bytes"));
        }
        return Bytes.concat(safeCiphertext, tag);
    }

    static SM4Options withResultTag(SM4Options options, byte[] resultTag) {
        if (!Checks.hasBytes(resultTag)) {
            return SM4Support.options(options);
        }
        SM4Options base = SM4Support.options(options);
        return SM4Options.builder()
            .mode(base.mode())
            .padding(base.padding())
            .iv(base.iv())
            .aad(base.aad())
            .tagLength(base.tagLength())
            .securityContext(base.securityContext())
            .tag(resultTag)
            .build();
    }
}

