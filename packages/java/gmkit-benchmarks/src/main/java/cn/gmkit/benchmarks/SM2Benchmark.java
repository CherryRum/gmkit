package cn.gmkit.benchmarks;

import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.core.SM2SignatureInputFormat;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;

/**
 * SM2 常见操作基准。
 */
@State(Scope.Benchmark)
public class SM2Benchmark {

    private final SM2 sm2 = new SM2();

    private byte[] payload32;
    private String publicKey;
    private String privateKey;
    private byte[] ciphertext;
    private byte[] signature;
    private SM2SignOptions signOptions;
    private SM2VerifyOptions verifyOptions;

    @Setup(Level.Trial)
    public void setUp() {
        payload32 = pattern(32, 0x3C);
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        publicKey = keyPair.publicKey();
        privateKey = keyPair.privateKey();
        signOptions = SM2SignOptions.builder()
            .signatureFormat(SM2SignatureFormat.RAW)
            .build();
        verifyOptions = SM2VerifyOptions.builder()
            .signatureFormat(SM2SignatureInputFormat.RAW)
            .build();
        ciphertext = sm2.encrypt(publicKey, payload32, SM2CipherMode.C1C3C2);
        signature = sm2.sign(privateKey, payload32, signOptions);
    }

    @Benchmark
    public SM2KeyPair generateKeyPair() {
        return sm2.generateKeyPair(false);
    }

    @Benchmark
    public byte[] encrypt32Bytes() {
        return sm2.encrypt(publicKey, payload32, SM2CipherMode.C1C3C2);
    }

    @Benchmark
    public byte[] decrypt32Bytes() {
        return sm2.decrypt(privateKey, ciphertext, SM2CipherMode.C1C3C2);
    }

    @Benchmark
    public byte[] sign32Bytes() {
        return sm2.sign(privateKey, payload32, signOptions);
    }

    @Benchmark
    public boolean verify32Bytes() {
        return sm2.verify(publicKey, payload32, signature, verifyOptions);
    }

    private static byte[] pattern(int size, int seed) {
        byte[] value = new byte[size];
        for (int i = 0; i < value.length; i++) {
            value[i] = (byte) (seed + i * 13);
        }
        return value;
    }
}
