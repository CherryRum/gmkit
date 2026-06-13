package cn.gmkit.benchmarks;

import cn.gmkit.sm3.SM3;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;

/**
 * SM3 吞吐与平均耗时基准。
 */
@State(Scope.Benchmark)
public class SM3Benchmark {

    private final SM3 sm3 = new SM3();

    private byte[] payload256;
    private byte[] payload4096;
    private byte[] hmacKey;

    @Setup(Level.Trial)
    public void setUp() {
        payload256 = pattern(256, 0x11);
        payload4096 = pattern(4096, 0x37);
        hmacKey = pattern(32, 0x5A);
    }

    @Benchmark
    public byte[] digest256Bytes() {
        return sm3.digest(payload256);
    }

    @Benchmark
    public byte[] digest4096Bytes() {
        return sm3.digest(payload4096);
    }

    @Benchmark
    public byte[] hmac256Bytes() {
        return sm3.hmac(hmacKey, payload256);
    }

    @Benchmark
    public byte[] hmac4096Bytes() {
        return sm3.hmac(hmacKey, payload4096);
    }

    private static byte[] pattern(int size, int seed) {
        byte[] value = new byte[size];
        for (int i = 0; i < value.length; i++) {
            value[i] = (byte) (seed + i * 31);
        }
        return value;
    }
}
