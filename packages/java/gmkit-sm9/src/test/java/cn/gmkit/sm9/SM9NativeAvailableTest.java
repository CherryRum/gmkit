package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * native 库可用性与平台探测测试。
 * <p>
 * 这些用例不依赖 native 库本身是否加载成功，因此在任何平台都会执行。
 */
class SM9NativeAvailableTest {

    @Test
    void versionShouldBeExposed() {
        assertNotNull(SM9.nativeVersion());
    }

    @Test
    void platformShouldBeExposed() {
        assertNotNull(SM9.nativePlatform());
    }

    @Test
    void isAvailableShouldNotThrow() {
        // 仅验证调用本身不抛异常；返回值取决于当前平台是否提供 native 库。
        boolean available = SM9.isAvailable();
        assertNotNull(Boolean.valueOf(available));
    }

    @Test
    void loadErrorMessageShouldReflectAvailability() {
        if (SM9.isAvailable()) {
            assertNull(SM9.nativeLoadErrorMessage());
        } else {
            assertNotNull(SM9.nativeLoadErrorMessage());
        }
    }

    @Test
    void nativeShouldBeAvailableWhenRequiredByBuild() {
        if (!Boolean.getBoolean(SM9Assumptions.REQUIRE_NATIVE_PROPERTY)) {
            return;
        }
        assertTrue(SM9.isAvailable(), SM9.nativeLoadErrorMessage());
    }

    @Test
    void platformDetectionShouldReturnTokenOrThrowUnsupported() {
        try {
            String platform = SM9NativeLoader.detectPlatform();
            assertNotNull(platform);
        } catch (SM9UnsupportedPlatformException expected) {
            // 当前 CPU 架构 / 操作系统不在支持列表内时，明确抛出该异常。
            assertNotNull(expected.getMessage());
        }
    }

    @Test
    void operationsShouldFailFastWhenNativeUnavailable() {
        if (SM9.isAvailable()) {
            return;
        }
        // native 不可用时，生成主密钥应抛出可识别的不支持异常。
        assertThrows(SM9UnsupportedPlatformException.class, SM9::generateSignMasterKey);
        assertFalse(SM9.isAvailable());
    }
}
