package cn.gmkit.zuc;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.Bytes;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.Messages;
import cn.gmkit.core.Texts;

/**
 * ZUC-128 stream cipher utilities.
 * <p>
 * The API accepts 16-byte keys and 16-byte IVs. Encryption and decryption are
 * the same XOR operation against the generated key stream.
 */
public final class ZUC {

    /**
     * ZUC-128 key length in bytes.
     */
    public static final int KEY_LENGTH = 16;

    /**
     * ZUC-128 IV length in bytes.
     */
    public static final int IV_LENGTH = 16;

    private static final int[] S0 = {
        0x3e, 0x72, 0x5b, 0x47, 0xca, 0xe0, 0x00, 0x33, 0x04, 0xd1, 0x54, 0x98, 0x09, 0xb9, 0x6d, 0xcb,
        0x7b, 0x1b, 0xf9, 0x32, 0xaf, 0x9d, 0x6a, 0xa5, 0xb8, 0x2d, 0xfc, 0x1d, 0x08, 0x53, 0x03, 0x90,
        0x4d, 0x4e, 0x84, 0x99, 0xe4, 0xce, 0xd9, 0x91, 0xdd, 0xb6, 0x85, 0x48, 0x8b, 0x29, 0x6e, 0xac,
        0xcd, 0xc1, 0xf8, 0x1e, 0x73, 0x43, 0x69, 0xc6, 0xb5, 0xbd, 0xfd, 0x39, 0x63, 0x20, 0xd4, 0x38,
        0x76, 0x7d, 0xb2, 0xa7, 0xcf, 0xed, 0x57, 0xc5, 0xf3, 0x2c, 0xbb, 0x14, 0x21, 0x06, 0x55, 0x9b,
        0xe3, 0xef, 0x5e, 0x31, 0x4f, 0x7f, 0x5a, 0xa4, 0x0d, 0x82, 0x51, 0x49, 0x5f, 0xba, 0x58, 0x1c,
        0x4a, 0x16, 0xd5, 0x17, 0xa8, 0x92, 0x24, 0x1f, 0x8c, 0xff, 0xd8, 0xae, 0x2e, 0x01, 0xd3, 0xad,
        0x3b, 0x4b, 0xda, 0x46, 0xeb, 0xc9, 0xde, 0x9a, 0x8f, 0x87, 0xd7, 0x3a, 0x80, 0x6f, 0x2f, 0xc8,
        0xb1, 0xb4, 0x37, 0xf7, 0x0a, 0x22, 0x13, 0x28, 0x7c, 0xcc, 0x3c, 0x89, 0xc7, 0xc3, 0x96, 0x56,
        0x07, 0xbf, 0x7e, 0xf0, 0x0b, 0x2b, 0x97, 0x52, 0x35, 0x41, 0x79, 0x61, 0xa6, 0x4c, 0x10, 0xfe,
        0xbc, 0x26, 0x95, 0x88, 0x8a, 0xb0, 0xa3, 0xfb, 0xc0, 0x18, 0x94, 0xf2, 0xe1, 0xe5, 0xe9, 0x5d,
        0xd0, 0xdc, 0x11, 0x66, 0x64, 0x5c, 0xec, 0x59, 0x42, 0x75, 0x12, 0xf5, 0x74, 0x9c, 0xaa, 0x23,
        0x0e, 0x86, 0xab, 0xbe, 0x2a, 0x02, 0xe7, 0x67, 0xe6, 0x44, 0xa2, 0x6c, 0xc2, 0x93, 0x9f, 0xf1,
        0xf6, 0xfa, 0x36, 0xd2, 0x50, 0x68, 0x9e, 0x62, 0x71, 0x15, 0x3d, 0xd6, 0x40, 0xc4, 0xe2, 0x0f,
        0x8e, 0x83, 0x77, 0x6b, 0x25, 0x05, 0x3f, 0x0c, 0x30, 0xea, 0x70, 0xb7, 0xa1, 0xe8, 0xa9, 0x65,
        0x8d, 0x27, 0x1a, 0xdb, 0x81, 0xb3, 0xa0, 0xf4, 0x45, 0x7a, 0x19, 0xdf, 0xee, 0x78, 0x34, 0x60
    };

    private static final int[] S1 = {
        0x55, 0xc2, 0x63, 0x71, 0x3b, 0xc8, 0x47, 0x86, 0x9f, 0x3c, 0xda, 0x5b, 0x29, 0xaa, 0xfd, 0x77,
        0x8c, 0xc5, 0x94, 0x0c, 0xa6, 0x1a, 0x13, 0x00, 0xe3, 0xa8, 0x16, 0x72, 0x40, 0xf9, 0xf8, 0x42,
        0x44, 0x26, 0x68, 0x96, 0x81, 0xd9, 0x45, 0x3e, 0x10, 0x76, 0xc6, 0xa7, 0x8b, 0x39, 0x43, 0xe1,
        0x3a, 0xb5, 0x56, 0x2a, 0xc0, 0x6d, 0xb3, 0x05, 0x22, 0x66, 0xbf, 0xdc, 0x0b, 0xfa, 0x62, 0x48,
        0xdd, 0x20, 0x11, 0x06, 0x36, 0xc9, 0xc1, 0xcf, 0xf6, 0x27, 0x52, 0xbb, 0x69, 0xf5, 0xd4, 0x87,
        0x7f, 0x84, 0x4c, 0xd2, 0x9c, 0x57, 0xa4, 0xbc, 0x4f, 0x9a, 0xdf, 0xfe, 0xd6, 0x8d, 0x7a, 0xeb,
        0x2b, 0x53, 0xd8, 0x5c, 0xa1, 0x14, 0x17, 0xfb, 0x23, 0xd5, 0x7d, 0x30, 0x67, 0x73, 0x08, 0x09,
        0xee, 0xb7, 0x70, 0x3f, 0x61, 0xb2, 0x19, 0x8e, 0x4e, 0xe5, 0x4b, 0x93, 0x8f, 0x5d, 0xdb, 0xa9,
        0xad, 0xf1, 0xae, 0x2e, 0xcb, 0x0d, 0xfc, 0xf4, 0x2d, 0x46, 0x6e, 0x1d, 0x97, 0xe8, 0xd1, 0xe9,
        0x4d, 0x37, 0xa5, 0x75, 0x5e, 0x83, 0x9e, 0xab, 0x82, 0x9d, 0xb9, 0x1c, 0xe0, 0xcd, 0x49, 0x89,
        0x01, 0xb6, 0xbd, 0x58, 0x24, 0xa2, 0x5f, 0x38, 0x78, 0x99, 0x15, 0x90, 0x50, 0xb8, 0x95, 0xe4,
        0xd0, 0x91, 0xc7, 0xce, 0xed, 0x0f, 0xb4, 0x6f, 0xa0, 0xcc, 0xf0, 0x02, 0x4a, 0x79, 0xc3, 0xde,
        0xa3, 0xef, 0xea, 0x51, 0xe6, 0x6b, 0x18, 0xec, 0x1b, 0x2c, 0x80, 0xf7, 0x74, 0xe7, 0xff, 0x21,
        0x5a, 0x6a, 0x54, 0x1e, 0x41, 0x31, 0x92, 0x35, 0xc4, 0x33, 0x07, 0x0a, 0xba, 0x7e, 0x0e, 0x34,
        0x88, 0xb1, 0x98, 0x7c, 0xf3, 0x3d, 0x60, 0x6c, 0x7b, 0xca, 0xd3, 0x1f, 0x32, 0x65, 0x04, 0x28,
        0x64, 0xbe, 0x85, 0x9b, 0x2f, 0x59, 0x8a, 0xd7, 0xb0, 0x25, 0xac, 0xaf, 0x12, 0x03, 0xe2, 0xf2
    };

    private static final int[] D_128 = {
        0x44d7, 0x26bc, 0x626b, 0x135e, 0x5789, 0x35e2, 0x7135, 0x09af,
        0x4d78, 0x2f13, 0x6bc4, 0x1af1, 0x5e26, 0x3c4d, 0x789a, 0x47ac
    };

    private ZUC() {
    }

    /**
     * Generate ZUC-128 key stream bytes.
     *
     * @param key         16-byte key
     * @param iv          16-byte IV
     * @param lengthBytes requested byte length, may be 0
     * @return key stream bytes
     */
    public static byte[] keystream(byte[] key, byte[] iv, int lengthBytes) {
        requireNonNegative(lengthBytes, "ZUC keystream length");
        State state = new State(requireKey(key), requireIv(iv));
        byte[] output = new byte[lengthBytes];
        int offset = 0;
        while (offset < lengthBytes) {
            int word = state.generateKeyword();
            for (int i = 0; i < 4 && offset < lengthBytes; i++, offset++) {
                output[offset] = (byte) ((word >>> (24 - i * 8)) & 0xff);
            }
        }
        return output;
    }

    /**
     * Generate ZUC-128 key stream bytes as hexadecimal.
     *
     * @param keyHex      32-hex-character key
     * @param ivHex       32-hex-character IV
     * @param lengthBytes requested byte length, may be 0
     * @return hexadecimal key stream
     */
    public static String keystreamHex(String keyHex, String ivHex, int lengthBytes) {
        return HexCodec.encode(keystream(decodeKey(keyHex), decodeIv(ivHex), lengthBytes));
    }

    /**
     * Generate ZUC-128 key stream words.
     *
     * @param key         16-byte key
     * @param iv          16-byte IV
     * @param lengthWords requested 32-bit word count, may be 0
     * @return unsigned 32-bit words stored in Java {@code int}s
     */
    public static int[] keystreamWords(byte[] key, byte[] iv, int lengthWords) {
        requireNonNegative(lengthWords, "ZUC keystream word length");
        State state = new State(requireKey(key), requireIv(iv));
        int[] output = new int[lengthWords];
        for (int i = 0; i < lengthWords; i++) {
            output[i] = state.generateKeyword();
        }
        return output;
    }

    /**
     * Generate ZUC-128 key stream words as hexadecimal bytes.
     *
     * @param keyHex      32-hex-character key
     * @param ivHex       32-hex-character IV
     * @param lengthWords requested 32-bit word count, may be 0
     * @return hexadecimal key stream
     */
    public static String keystreamWordsHex(String keyHex, String ivHex, int lengthWords) {
        return HexCodec.encode(wordsToBytes(keystreamWords(decodeKey(keyHex), decodeIv(ivHex), lengthWords)));
    }

    /**
     * Encrypt bytes with ZUC-128.
     *
     * @param key       16-byte key
     * @param iv        16-byte IV
     * @param plaintext plaintext bytes, may be empty
     * @return ciphertext bytes
     */
    public static byte[] encrypt(byte[] key, byte[] iv, byte[] plaintext) {
        return process(key, iv, plaintext, "ZUC plaintext");
    }

    /**
     * Decrypt bytes with ZUC-128.
     *
     * @param key        16-byte key
     * @param iv         16-byte IV
     * @param ciphertext ciphertext bytes, may be empty
     * @return plaintext bytes
     */
    public static byte[] decrypt(byte[] key, byte[] iv, byte[] ciphertext) {
        return process(key, iv, ciphertext, "ZUC ciphertext");
    }

    /**
     * Encrypt a UTF-8 string and return hexadecimal ciphertext.
     *
     * @param keyHex    32-hex-character key
     * @param ivHex     32-hex-character IV
     * @param plaintext UTF-8 text
     * @return hexadecimal ciphertext
     */
    public static String encryptHex(String keyHex, String ivHex, String plaintext) {
        return HexCodec.encode(encrypt(decodeKey(keyHex), decodeIv(ivHex), Texts.utf8(plaintext)));
    }

    /**
     * Encrypt a UTF-8 string and return Base64 ciphertext.
     *
     * @param keyHex    32-hex-character key
     * @param ivHex     32-hex-character IV
     * @param plaintext UTF-8 text
     * @return Base64 ciphertext
     */
    public static String encryptBase64(String keyHex, String ivHex, String plaintext) {
        return Base64Codec.encode(encrypt(decodeKey(keyHex), decodeIv(ivHex), Texts.utf8(plaintext)));
    }

    /**
     * Decrypt hexadecimal ciphertext and decode the plaintext as UTF-8.
     *
     * @param keyHex        32-hex-character key
     * @param ivHex         32-hex-character IV
     * @param ciphertextHex hexadecimal ciphertext
     * @return plaintext text
     */
    public static String decryptHexToUtf8(String keyHex, String ivHex, String ciphertextHex) {
        byte[] plaintext = decrypt(decodeKey(keyHex), decodeIv(ivHex), HexCodec.decodeStrict(ciphertextHex, "ZUC ciphertext"));
        return Texts.utf8(plaintext);
    }

    /**
     * Decrypt Base64 ciphertext and decode the plaintext as UTF-8.
     *
     * @param keyHex           32-hex-character key
     * @param ivHex            32-hex-character IV
     * @param ciphertextBase64 Base64 ciphertext
     * @return plaintext text
     */
    public static String decryptBase64ToUtf8(String keyHex, String ivHex, String ciphertextBase64) {
        byte[] plaintext = decrypt(decodeKey(keyHex), decodeIv(ivHex), Base64Codec.decode(ciphertextBase64, "ZUC ciphertext"));
        return Texts.utf8(plaintext);
    }

    /**
     * Generate EEA3 key stream as hexadecimal bytes.
     * <p>
     * The return value is word-aligned, matching the current TypeScript API.
     *
     * @param keyHex    32-hex-character key
     * @param count     32-bit counter
     * @param bearer    5-bit bearer identifier, 0 to 31
     * @param direction direction bit, 0 or 1
     * @param bitLength requested bit length, may be 0
     * @return word-aligned hexadecimal key stream
     */
    public static String eea3(String keyHex, int count, int bearer, int direction, int bitLength) {
        requireBearer(bearer);
        requireDirection(direction);
        requireNonNegative(bitLength, "ZUC EEA3 bit length");
        byte[] iv = new byte[IV_LENGTH];
        iv[0] = (byte) (count >>> 24);
        iv[1] = (byte) (count >>> 16);
        iv[2] = (byte) (count >>> 8);
        iv[3] = (byte) count;
        iv[4] = (byte) (((bearer << 3) | (direction << 2)) & 0xff);
        int words = (bitLength + 31) / 32;
        return HexCodec.encode(wordsToBytes(keystreamWords(decodeKey(keyHex), iv, words)));
    }

    /**
     * Generate the current project EIA3-compatible MAC value.
     *
     * @param keyHex    32-hex-character key
     * @param count     32-bit counter
     * @param bearer    5-bit bearer identifier, 0 to 31
     * @param direction direction bit, 0 or 1
     * @param message   message bytes
     * @return 8-character hexadecimal MAC
     */
    public static String eia3(String keyHex, int count, int bearer, int direction, byte[] message) {
        requireBearer(bearer);
        requireDirection(direction);
        byte[] messageBytes = Bytes.requireNonNull(message, "ZUC EIA3 message");
        int bitLength = messageBytes.length * 8;
        byte[] iv = new byte[IV_LENGTH];
        byte[] countAndBearer = {
            (byte) (count >>> 24),
            (byte) (count >>> 16),
            (byte) (count >>> 8),
            (byte) count,
            (byte) ((((bearer & 0x1f) << 3) | ((direction & 0x1) << 2)) & 0xff)
        };
        iv[0] = countAndBearer[0];
        iv[1] = countAndBearer[1];
        iv[2] = countAndBearer[2];
        iv[3] = countAndBearer[3];
        iv[4] = countAndBearer[4];
        iv[8] = countAndBearer[0];
        iv[9] = countAndBearer[1];
        iv[10] = countAndBearer[2];
        iv[11] = countAndBearer[3];
        iv[12] = countAndBearer[4];

        int[] keystream = keystreamWords(decodeKey(keyHex), iv, (bitLength + 64 + 31) / 32);
        int t = 0;
        for (int i = 0; i < messageBytes.length; i++) {
            int wordIndex = (i * 8) / 32;
            int shift = 24 - ((i * 8) % 32);
            int keyByte = (keystream[wordIndex] >>> shift) & 0xff;
            t ^= (messageBytes[i] & 0xff) ^ keyByte;
        }
        if (getBit(keystream, bitLength)) {
            t ^= bitLength;
        }
        int mac = t ^ keystream[bitLength / 32];
        return String.format("%08x", mac);
    }

    /**
     * Generate the current project EIA3-compatible MAC value for UTF-8 text.
     *
     * @param keyHex    32-hex-character key
     * @param count     32-bit counter
     * @param bearer    5-bit bearer identifier, 0 to 31
     * @param direction direction bit, 0 or 1
     * @param message   UTF-8 message text
     * @return 8-character hexadecimal MAC
     */
    public static String eia3(String keyHex, int count, int bearer, int direction, String message) {
        return eia3(keyHex, count, bearer, direction, Texts.utf8(message));
    }

    private static byte[] process(byte[] key, byte[] iv, byte[] data, String label) {
        byte[] keyBytes = requireKey(key);
        byte[] ivBytes = requireIv(iv);
        byte[] input = Bytes.requireNonNull(data, label);
        State state = new State(keyBytes, ivBytes);
        byte[] output = new byte[input.length];
        int fullWords = input.length / 4;
        int remainder = input.length % 4;
        for (int i = 0; i < fullWords; i++) {
            int word = state.generateKeyword();
            int offset = i * 4;
            output[offset] = (byte) (input[offset] ^ ((word >>> 24) & 0xff));
            output[offset + 1] = (byte) (input[offset + 1] ^ ((word >>> 16) & 0xff));
            output[offset + 2] = (byte) (input[offset + 2] ^ ((word >>> 8) & 0xff));
            output[offset + 3] = (byte) (input[offset + 3] ^ (word & 0xff));
        }
        if (remainder > 0) {
            int word = state.generateKeyword();
            int offset = fullWords * 4;
            for (int i = 0; i < remainder; i++) {
                output[offset + i] = (byte) (input[offset + i] ^ ((word >>> (24 - i * 8)) & 0xff));
            }
        }
        return output;
    }

    private static byte[] requireKey(byte[] key) {
        return Bytes.requireLength(Bytes.clone(key), KEY_LENGTH, "ZUC key");
    }

    private static byte[] requireIv(byte[] iv) {
        return Bytes.requireLength(Bytes.clone(iv), IV_LENGTH, "ZUC IV");
    }

    private static byte[] decodeKey(String keyHex) {
        return requireKey(HexCodec.decodeStrict(keyHex, "ZUC key"));
    }

    private static byte[] decodeIv(String ivHex) {
        return requireIv(HexCodec.decodeStrict(ivHex, "ZUC IV"));
    }

    private static void requireNonNegative(int value, String label) {
        if (value < 0) {
            throw new GmkitException(Messages.bilingual(label + " 不能为负数", label + " must not be negative"));
        }
    }

    private static void requireBearer(int bearer) {
        if (bearer < 0 || bearer > 31) {
            throw new GmkitException(Messages.bilingual("ZUC bearer 必须在 0 到 31 之间", "ZUC bearer must be between 0 and 31"));
        }
    }

    private static void requireDirection(int direction) {
        if (direction != 0 && direction != 1) {
            throw new GmkitException(Messages.bilingual("ZUC direction 必须为 0 或 1", "ZUC direction must be 0 or 1"));
        }
    }

    private static byte[] wordsToBytes(int[] words) {
        byte[] output = new byte[words.length * 4];
        for (int i = 0; i < words.length; i++) {
            int word = words[i];
            int offset = i * 4;
            output[offset] = (byte) (word >>> 24);
            output[offset + 1] = (byte) (word >>> 16);
            output[offset + 2] = (byte) (word >>> 8);
            output[offset + 3] = (byte) word;
        }
        return output;
    }

    private static boolean getBit(int[] keystream, int bitPosition) {
        int wordIndex = bitPosition / 32;
        int bitIndex = 31 - (bitPosition % 32);
        return ((keystream[wordIndex] >>> bitIndex) & 1) == 1;
    }

    private static final class State {

        private final int[] lfsr = new int[16];
        private final int[] x = new int[4];
        private int r1;
        private int r2;

        private State(byte[] key, byte[] iv) {
            initialize(key, iv);
        }

        private void initialize(byte[] key, byte[] iv) {
            for (int i = 0; i < 16; i++) {
                lfsr[i] = (((key[i] & 0xff) << 23) | (D_128[i] << 8) | (iv[i] & 0xff)) & 0x7fffffff;
            }
            r1 = 0;
            r2 = 0;
            for (int i = 0; i < 32; i++) {
                bitReorganization();
                int w = fFunction();
                lfsrWithInitMode(w >>> 1);
            }
            bitReorganization();
            fFunction();
            lfsrWithWorkMode();
        }

        private void bitReorganization() {
            x[0] = ((lfsr[15] & 0x7fff8000) << 1) | (lfsr[14] & 0xffff);
            x[1] = ((lfsr[11] & 0xffff) << 16) | (lfsr[9] >>> 15);
            x[2] = ((lfsr[7] & 0xffff) << 16) | (lfsr[5] >>> 15);
            x[3] = ((lfsr[2] & 0xffff) << 16) | (lfsr[0] >>> 15);
        }

        private int fFunction() {
            int w = (x[0] ^ r1) + r2;
            int w1 = r1 + x[1];
            int w2 = r2 ^ x[2];
            r1 = s(l1(((w1 & 0xffff) << 16) | (w2 >>> 16)));
            r2 = s(l2(((w2 & 0xffff) << 16) | (w1 >>> 16)));
            return w;
        }

        private int s(int value) {
            return (S0[(value >>> 24) & 0xff] << 24)
                | (S1[(value >>> 16) & 0xff] << 16)
                | (S0[(value >>> 8) & 0xff] << 8)
                | S1[value & 0xff];
        }

        private int l1(int value) {
            return value ^ rotl(value, 2) ^ rotl(value, 10) ^ rotl(value, 18) ^ rotl(value, 24);
        }

        private int l2(int value) {
            return value ^ rotl(value, 8) ^ rotl(value, 14) ^ rotl(value, 22) ^ rotl(value, 30);
        }

        private int rotl(int value, int bits) {
            return (value << bits) | (value >>> (32 - bits));
        }

        private void lfsrWithInitMode(int u) {
            int s16 = addMod(lfsrFeedback(), u);
            if (s16 == 0) {
                s16 = 0x7fffffff;
            }
            shiftLfsr(s16);
        }

        private void lfsrWithWorkMode() {
            int s16 = lfsrFeedback();
            if (s16 == 0) {
                s16 = 0x7fffffff;
            }
            shiftLfsr(s16);
        }

        private int lfsrFeedback() {
            int v = mulByPow2(lfsr[15], 15);
            v = addMod(v, mulByPow2(lfsr[13], 17));
            v = addMod(v, mulByPow2(lfsr[10], 21));
            v = addMod(v, mulByPow2(lfsr[4], 20));
            v = addMod(v, mulByPow2(lfsr[0], 8));
            return addMod(v, lfsr[0]);
        }

        private void shiftLfsr(int next) {
            System.arraycopy(lfsr, 1, lfsr, 0, 15);
            lfsr[15] = next;
        }

        private int addMod(int a, int b) {
            int c = a + b;
            return (c & 0x7fffffff) + (c >>> 31);
        }

        private int mulByPow2(int value, int pow) {
            return ((value << pow) | (value >>> (31 - pow))) & 0x7fffffff;
        }

        private int generateKeyword() {
            bitReorganization();
            int z = fFunction() ^ x[3];
            lfsrWithWorkMode();
            return z;
        }
    }
}
