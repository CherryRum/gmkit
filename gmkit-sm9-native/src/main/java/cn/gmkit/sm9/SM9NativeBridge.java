package cn.gmkit.sm9;

/**
 * SM9 JNI 桥接层，声明与 GmSSL native 库一一对应的 {@code native} 方法。
 * <p>
 * 该类不对外暴露，所有 native 资源以 {@code long} 句柄（native 指针）形式在 Java 与
 * C 之间传递。上层封装类（{@link SM9SignMasterKey} 等）负责句柄的生命周期管理与参数校验，
 * 本类只做最薄的方法映射。
 * <p>
 * native 库的加载由 {@link SM9NativeLoader} 在静态块中触发；若当前平台没有可用的 native
 * 库，则 {@link #isAvailable()} 返回 {@code false}，所有 native 调用前应先行检查。
 *
 * <h2>对应关系</h2>
 * 桥接的 native 库为 {@code gmkitsm9}（依赖 GmSSL v3.1.1 的 {@code gmssl} 动态库），
 * JNI 函数命名遵循 {@code Java_cn_gmkit_sm9_SM9NativeBridge_*} 规则，实现位于
 * {@code src/main/c/gmkitsm9.c}。
 */
final class SM9NativeBridge {

    /**
     * native 桥接所基于的 GmSSL 版本标识，便于排查 ABI 不一致问题。
     */
    static final String VERSION = "GmKit SM9 JNI (GmSSL 3.1.1)";

    /**
     * SM9 加密单次明文的最大字节数，超过该长度需自行采用混合加密。
     * <p>
     * 该数值与 GmSSL {@code SM9_MAX_PLAINTEXT_SIZE} 一致。
     */
    static final int SM9_MAX_PLAINTEXT_SIZE = 255;

    private static final boolean AVAILABLE;

    private static final Throwable LOAD_ERROR;

    static {
        Throwable error = null;
        boolean available;
        try {
            SM9NativeLoader.load();
            available = true;
        } catch (Throwable t) {
            available = false;
            error = t;
        }
        AVAILABLE = available;
        LOAD_ERROR = error;
    }

    private SM9NativeBridge() {
    }

    /**
     * 判断当前平台的 SM9 native 库是否已成功加载。
     *
     * @return 已加载返回 {@code true}
     */
    static boolean isAvailable() {
        return AVAILABLE;
    }

    /**
     * 返回 native 库加载失败时的根因（用于诊断），加载成功时返回 {@code null}。
     *
     * @return 加载错误或 {@code null}
     */
    static Throwable loadError() {
        return LOAD_ERROR;
    }

    /**
     * 在 native 库不可用时抛出带诊断信息的异常。
     */
    static void requireAvailable() {
        if (!AVAILABLE) {
            throw new SM9UnsupportedPlatformException(
                    SM9Messages.nativeUnavailable(LOAD_ERROR), LOAD_ERROR);
        }
    }

    // ---------------------------------------------------------------------
    // 签名主密钥（KGC 侧）
    // ---------------------------------------------------------------------

    static native long sm9SignMasterKeyGenerate();

    static native void sm9SignMasterKeyFree(long masterKey);

    static native int sm9SignMasterKeyInfoEncryptToPem(long masterKey, String pass, String file);

    static native long sm9SignMasterKeyInfoDecryptFromPem(String pass, String file);

    static native int sm9SignMasterPublicKeyToPem(long masterKey, String file);

    static native long sm9SignMasterPublicKeyFromPem(String file);

    static native long sm9SignMasterKeyExtractKey(long masterKey, String id);

    // ---------------------------------------------------------------------
    // 用户签名私钥
    // ---------------------------------------------------------------------

    static native void sm9SignKeyFree(long signKey);

    static native int sm9SignKeyInfoEncryptToPem(long signKey, String pass, String file);

    static native long sm9SignKeyInfoDecryptFromPem(String pass, String file);

    // ---------------------------------------------------------------------
    // 签名 / 验签上下文（支持流式 update）
    // ---------------------------------------------------------------------

    static native long sm9SignCtxNew();

    static native void sm9SignCtxFree(long ctx);

    static native int sm9SignInit(long ctx);

    static native int sm9SignUpdate(long ctx, byte[] data, int offset, int length);

    static native byte[] sm9SignFinish(long ctx, long signKey);

    static native int sm9VerifyInit(long ctx);

    static native int sm9VerifyUpdate(long ctx, byte[] data, int offset, int length);

    static native int sm9VerifyFinish(long ctx, byte[] signature, long masterPublicKey, String id);

    // ---------------------------------------------------------------------
    // 加密主密钥（KGC + 加密方侧）
    // ---------------------------------------------------------------------

    static native long sm9EncMasterKeyGenerate();

    static native void sm9EncMasterKeyFree(long masterKey);

    static native int sm9EncMasterKeyInfoEncryptToPem(long masterKey, String pass, String file);

    static native long sm9EncMasterKeyInfoDecryptFromPem(String pass, String file);

    static native int sm9EncMasterPublicKeyToPem(long masterKey, String file);

    static native long sm9EncMasterPublicKeyFromPem(String file);

    static native long sm9EncMasterKeyExtractKey(long masterKey, String id);

    // ---------------------------------------------------------------------
    // 用户解密私钥
    // ---------------------------------------------------------------------

    static native void sm9EncKeyFree(long encKey);

    static native int sm9EncKeyInfoEncryptToPem(long encKey, String pass, String file);

    static native long sm9EncKeyInfoDecryptFromPem(String pass, String file);

    // ---------------------------------------------------------------------
    // 加密 / 解密（IBE，一次性）
    // ---------------------------------------------------------------------

    static native byte[] sm9Encrypt(long masterPublicKey, String id, byte[] plaintext);

    static native byte[] sm9Decrypt(long encKey, String id, byte[] ciphertext);
}
