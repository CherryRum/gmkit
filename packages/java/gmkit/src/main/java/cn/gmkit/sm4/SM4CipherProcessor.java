package cn.gmkit.sm4;

import cn.gmkit.core.*;
import org.bouncycastle.jcajce.spec.AEADParameterSpec;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.security.Provider;
import java.security.spec.AlgorithmParameterSpec;

final class SM4CipherProcessor {

    private SM4CipherProcessor() {
    }

    static byte[] generateKey(GmSecurityContext securityContext) {
        GmSecurityContext context = SM4Support.context(securityContext);
        try {
            KeyGenerator generator = KeyGenerator.getInstance(SM4Support.ALGORITHM, context.provider());
            generator.init(SM4Support.DEFAULT_KEY_SIZE, context.secureRandom());
            SecretKey secretKey = generator.generateKey();
            return secretKey.getEncoded();
        } catch (GeneralSecurityException ex) {
            throw new GmkitException(Messages.bilingual(
                "生成 SM4 密钥失败，请确认当前 Provider 支持 SM4",
                "Failed to generate SM4 key: please verify the configured Provider supports SM4"), ex);
        }
    }

    static SM4CipherResult encrypt(byte[] key, byte[] data, SM4Options options) {
        SM4Options resolved = SM4Support.options(options);
        byte[] safeKey = Bytes.requireLength(key, SM4Support.BLOCK_SIZE, "SM4 key");
        byte[] safeData = Bytes.requireNonNull(data, "Plaintext");
        if (resolved.hasTag()) {
            throw new GmkitException(Messages.bilingual(
                "SM4 加密参数中不应预先提供认证 tag，tag 应由加密过程生成",
                "SM4 encryption options must not provide an authentication tag; tags are generated during encryption"));
        }
        validateOptionCompatibility(resolved);
        byte[] prepared = SM4Paddings.apply(safeData, resolved.mode(), resolved.padding());
        int tagLength = SM4Support.resolveTagLength(resolved.mode(), resolved.tagLength());
        Cipher cipher = initCipher(Cipher.ENCRYPT_MODE, safeKey, resolved, tagLength);
        try {
            byte[] encrypted = cipher.doFinal(prepared);
            return SM4AeadSupport.splitCiphertextAndTag(resolved.mode(), encrypted, tagLength);
        } catch (GeneralSecurityException ex) {
            throw wrapCipherFailure(ex, true, resolved);
        }
    }

    static byte[] decrypt(byte[] key, byte[] ciphertext, SM4Options options) {
        SM4Options resolved = SM4Support.options(options);
        byte[] safeKey = Bytes.requireLength(key, SM4Support.BLOCK_SIZE, "SM4 key");
        byte[] safeCiphertext = Bytes.requireNonNull(ciphertext, "Ciphertext");
        validateOptionCompatibility(resolved);
        int tagLength = SM4Support.resolveTagLength(resolved.mode(), resolved.tagLength());
        byte[] cipherInput = SM4AeadSupport.appendTagIfNeeded(
            safeCiphertext,
            resolved.tagUnsafe(),
            resolved.mode(),
            tagLength);
        Cipher cipher = initCipher(Cipher.DECRYPT_MODE, safeKey, resolved, tagLength);
        try {
            byte[] decrypted = cipher.doFinal(cipherInput);
            return SM4Paddings.strip(decrypted, resolved.mode(), resolved.padding());
        } catch (GeneralSecurityException ex) {
            throw wrapCipherFailure(ex, false, resolved);
        }
    }

    private static Cipher initCipher(int opMode, byte[] key, SM4Options options, int tagLength) {
        try {
            Cipher cipher = Cipher.getInstance(transformation(options.mode(), options.padding()), provider(options));
            SecretKeySpec keySpec = new SecretKeySpec(key, SM4Support.ALGORITHM);
            AlgorithmParameterSpec parameterSpec = parameterSpec(options, tagLength);
            if (parameterSpec == null) {
                cipher.init(opMode, keySpec);
            } else {
                cipher.init(opMode, keySpec, parameterSpec, context(options).secureRandom());
            }
            if (isAead(options.mode()) && options.aadUnsafe() != null && options.aadUnsafe().length > 0) {
                cipher.updateAAD(options.aadUnsafe());
            }
            return cipher;
        } catch (GeneralSecurityException ex) {
            throw wrapCipherFailure(ex, opMode == Cipher.ENCRYPT_MODE, options);
        }
    }

    private static GmSecurityContext context(SM4Options options) {
        return SM4Support.context(options.securityContext());
    }

    private static Provider provider(SM4Options options) {
        return context(options).provider();
    }

    private static String transformation(SM4CipherMode mode, SM4Padding padding) {
        SM4CipherMode resolvedMode = mode != null ? mode : SM4CipherMode.ECB;
        if (resolvedMode == SM4CipherMode.ECB || resolvedMode == SM4CipherMode.CBC) {
            return SM4Support.ALGORITHM + "/" + resolvedMode.name() + "/" + jcePadding(padding);
        }
        return SM4Support.ALGORITHM + "/" + resolvedMode.name() + "/NoPadding";
    }

    private static String jcePadding(SM4Padding padding) {
        SM4Padding resolvedPadding = padding != null ? padding : SM4Padding.PKCS7;
        return resolvedPadding == SM4Padding.PKCS7 ? "PKCS7Padding" : "NoPadding";
    }

    private static AlgorithmParameterSpec parameterSpec(SM4Options options, int tagLength) {
        SM4CipherMode mode = options.mode();
        if (mode == null || mode == SM4CipherMode.ECB) {
            return null;
        }
        byte[] iv = requireIv(mode, options.ivUnsafe());
        if (mode == SM4CipherMode.GCM) {
            return new GCMParameterSpec(tagLength * 8, iv);
        }
        if (mode == SM4CipherMode.CCM) {
            return new AEADParameterSpec(iv, tagLength * 8);
        }
        return new IvParameterSpec(iv);
    }

    private static void validateOptionCompatibility(SM4Options options) {
        if (!isAead(options.mode()) && options.aadUnsafe() != null && options.aadUnsafe().length > 0) {
            throw new GmkitException(Messages.bilingual(
                "SM4 的 AAD 仅在 GCM 或 CCM 模式下受支持",
                "SM4 AAD is only supported in GCM or CCM mode"));
        }
    }

    private static boolean isAead(SM4CipherMode mode) {
        return mode == SM4CipherMode.GCM || mode == SM4CipherMode.CCM;
    }

    private static byte[] requireIv(SM4CipherMode mode, byte[] iv) {
        if (mode == SM4CipherMode.ECB) {
            return null;
        }
        if (iv == null || iv.length == 0) {
            throw new GmkitException(Messages.bilingual(
                "SM4 " + mode.name() + " 模式必须提供 IV/nonce",
                "SM4 " + mode.name() + " mode requires an IV/nonce"));
        }
        if (mode == SM4CipherMode.CBC || mode == SM4CipherMode.CTR || mode == SM4CipherMode.CFB || mode == SM4CipherMode.OFB) {
            return Bytes.requireLength(iv, SM4Support.BLOCK_SIZE, "SM4 " + mode.name() + " IV");
        }
        if (mode == SM4CipherMode.GCM) {
            if (iv.length < 12 || iv.length > 16) {
                throw new GmkitException(Messages.bilingual(
                    "SM4 GCM nonce 长度无效，应为 12 到 16 字节",
                    "Invalid SM4 GCM nonce length: expected 12 to 16 bytes"));
            }
            return iv;
        }
        if (mode == SM4CipherMode.CCM) {
            if (iv.length < 7 || iv.length > 13) {
                throw new GmkitException(Messages.bilingual(
                    "SM4 CCM nonce 长度无效，应为 7 到 13 字节",
                    "Invalid SM4 CCM nonce length: expected 7 to 13 bytes"));
            }
            return iv;
        }
        return iv;
    }

    private static GmkitException wrapCipherFailure(Exception ex, boolean encrypt, SM4Options options) {
        SM4CipherMode mode = options.mode();
        String action = encrypt ? "encryption" : "decryption";
        if (!encrypt && isAuthenticationFailure(ex, mode)) {
            return new GmkitException(
                Messages.bilingual(
                    "SM4 " + mode.name() + " 认证失败，请检查密钥、nonce、AAD 和 tag",
                    "SM4 " + mode.name() + " authentication failed: please verify the key, nonce, AAD and tag"),
                ex);
        }
        if (!encrypt && ex instanceof BadPaddingException) {
            return new GmkitException(
                Messages.bilingual(
                    "SM4 " + mode.name() + " 解密失败，密文或填充无效",
                    "SM4 " + mode.name() + " decryption failed: invalid ciphertext or padding"),
                ex);
        }
        if (!encrypt && ex instanceof IllegalBlockSizeException) {
            return new GmkitException(
                Messages.bilingual(
                    "SM4 " + mode.name() + " 解密失败，密文长度与当前模式不匹配",
                    "SM4 " + mode.name() + " decryption failed: ciphertext length is not valid for the configured mode"),
                ex);
        }
        return new GmkitException(
            Messages.bilingual(
                "SM4 " + mode.name() + (encrypt ? " 加密" : " 解密") + "失败，请检查密钥、模式、填充、IV/nonce 和 Provider 配置",
                "SM4 " + mode.name() + " " + action + " failed: please verify the key, mode, padding, IV/nonce and Provider configuration"),
            ex);
    }

    private static boolean isAuthenticationFailure(Exception ex, SM4CipherMode mode) {
        if (!isAead(mode)) {
            return false;
        }
        if (ex instanceof AEADBadTagException) {
            return true;
        }
        String message = ex.getMessage();
        if (message == null) {
            return false;
        }
        String lowerCase = message.toLowerCase();
        return lowerCase.contains("tag mismatch")
            || lowerCase.contains("mac check")
            || lowerCase.contains("authentication");
    }
}
