package cn.gmkit.benchmarks;

import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;

/**
 * SM4 常用模式基准。
 */
@State(Scope.Benchmark)
public class SM4Benchmark {

    private static final byte[] KEY = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
    private static final byte[] CBC_IV = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "CBC IV");
    private static final byte[] GCM_IV = HexCodec.decodeStrict("00112233445566778899aabb", "GCM IV");
    private static final byte[] GCM_AAD = HexCodec.decodeStrict("0102030405060708", "GCM AAD");

    private final SM4 sm4 = new SM4();

    private byte[] payload1024;
    private SM4Options cbcOptions;
    private SM4Options gcmOptions;
    private SM4CipherResult cbcCiphertext;
    private SM4CipherResult gcmCiphertext;

    @Setup(Level.Trial)
    public void setUp() {
        payload1024 = pattern(1024, 0x21);
        cbcOptions = SM4Options.builder()
            .mode(SM4CipherMode.CBC)
            .padding(SM4Padding.PKCS7)
            .iv(CBC_IV)
            .build();
        gcmOptions = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .iv(GCM_IV)
            .aad(GCM_AAD)
            .tagLength(16)
            .build();
        cbcCiphertext = sm4.encrypt(KEY, payload1024, cbcOptions);
        gcmCiphertext = sm4.encrypt(KEY, payload1024, gcmOptions);
    }

    @Benchmark
    public SM4CipherResult encryptCbcPkcs7_1024Bytes() {
        return sm4.encrypt(KEY, payload1024, cbcOptions);
    }

    @Benchmark
    public byte[] decryptCbcPkcs7_1024Bytes() {
        return sm4.decrypt(KEY, cbcCiphertext, cbcOptions);
    }

    @Benchmark
    public SM4CipherResult encryptGcm_1024Bytes() {
        return sm4.encrypt(KEY, payload1024, gcmOptions);
    }

    @Benchmark
    public byte[] decryptGcm_1024Bytes() {
        return sm4.decrypt(KEY, gcmCiphertext, gcmOptions);
    }

    private static byte[] pattern(int size, int seed) {
        byte[] value = new byte[size];
        for (int i = 0; i < value.length; i++) {
            value[i] = (byte) (seed + i * 17);
        }
        return value;
    }
}
