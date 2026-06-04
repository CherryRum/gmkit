package cn.gmkit.sm9;

import org.junit.jupiter.api.condition.EnabledIf;

/**
 * 测试条件辅助：仅当当前平台存在可用的 SM9 native 库时才执行相关测试。
 * <p>
 * 在未编译 / 未提供 native 库的环境（如未安装 GmSSL 的普通 CI），相关测试将被
 * {@link EnabledIf} 优雅跳过，而不会失败。
 */
final class SM9Assumptions {

    private SM9Assumptions() {
    }

    /**
     * 供 {@code @EnabledIf} 引用的判定方法。
     *
     * @return native 库可用返回 {@code true}
     */
    static boolean nativeAvailable() {
        return SM9.isAvailable();
    }
}
