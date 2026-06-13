package cn.gmkit.sm4;

import cn.gmkit.core.*;

final class SM4Support {

    static final String ALGORITHM = "SM4";
    static final int BLOCK_SIZE = 16;
    static final int DEFAULT_KEY_SIZE = 128;
    private static final SM4Options DEFAULT_OPTIONS = SM4Options.builder().build();

    private SM4Support() {
    }

    static GmSecurityContext context(GmSecurityContext securityContext) {
        return Checks.defaultIfNull(securityContext, GmSecurityContexts.defaults());
    }

    static SM4Options options(SM4Options options) {
        return Checks.defaultIfNull(options, DEFAULT_OPTIONS);
    }

    static int resolveTagLength(SM4CipherMode mode, Integer configuredTagLength) {
        if (mode == SM4CipherMode.GCM) {
            int resolved = Checks.defaultIfNull(configuredTagLength, 16);
            if (resolved < 12 || resolved > 16) {
                throw new GmkitException(Messages.bilingual(
                    "SM4 GCM tag 长度无效，应为 12 到 16 字节",
                    "Invalid SM4 GCM tag length: expected 12 to 16 bytes"));
            }
            return resolved;
        }
        if (mode == SM4CipherMode.CCM) {
            int resolved = Checks.defaultIfNull(configuredTagLength, 16);
            if (resolved < 4 || resolved > 16 || (resolved & 1) != 0) {
                throw new GmkitException(Messages.bilingual(
                    "SM4 CCM tag 长度无效，应为 4 到 16 字节之间的偶数",
                    "Invalid SM4 CCM tag length: expected an even value between 4 and 16 bytes"));
            }
            return resolved;
        }
        return 0;
    }

    static void requireBlockMultiple(int length, String label) {
        if (length % BLOCK_SIZE != 0) {
            throw new GmkitException(Messages.multipleOf(label, 16));
        }
    }
}
