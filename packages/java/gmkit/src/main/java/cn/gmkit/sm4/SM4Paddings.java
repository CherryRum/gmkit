package cn.gmkit.sm4;

import cn.gmkit.core.Bytes;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;

final class SM4Paddings {

    private SM4Paddings() {
    }

    static byte[] apply(byte[] data, SM4CipherMode mode, SM4Padding padding) {
        byte[] source = Bytes.requireNonNull(data, "Plaintext");
        if (mode.isStreamLike()) {
            return source;
        }
        if (padding == SM4Padding.NONE) {
            SM4Support.requireBlockMultiple(source.length, "Plaintext");
            return source;
        }
        if (padding == SM4Padding.ZERO) {
            if (source.length % SM4Support.BLOCK_SIZE == 0) {
                return source;
            }
            byte[] padded = new byte[((source.length / SM4Support.BLOCK_SIZE) + 1) * SM4Support.BLOCK_SIZE];
            System.arraycopy(source, 0, padded, 0, source.length);
            return padded;
        }
        return source;
    }

    static byte[] strip(byte[] data, SM4CipherMode mode, SM4Padding padding) {
        if (mode.isStreamLike() || padding != SM4Padding.ZERO) {
            return data;
        }
        int end = data.length;
        while (end > 0 && data[end - 1] == 0) {
            end--;
        }
        if (end == data.length) {
            return data;
        }
        byte[] trimmed = new byte[end];
        System.arraycopy(data, 0, trimmed, 0, end);
        return trimmed;
    }
}

