package cn.gmkit.sm9;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;

/**
 * SM9 native 库加载器，负责按操作系统 / CPU 架构定位并加载 GmSSL JNI 桥接库。
 *
 * <h2>加载顺序</h2>
 * <ol>
 *     <li>系统属性 {@code -Dgmkit.sm9.native.path=/abs/path/to/libgmkitsm9.so}：直接加载指定文件，
 *     并尝试从同目录预加载 {@code gmssl} 依赖库；</li>
 *     <li>{@code System.loadLibrary("gmkitsm9")}：从 {@code java.library.path} 或系统库路径加载；</li>
 *     <li>JAR 内置：从 classpath {@code native/{platform}/} 解压 {@code gmssl} 依赖库与桥接库到临时目录后加载。</li>
 * </ol>
 *
 * <h2>平台标识</h2>
 * {@code linux-x86_64}、{@code linux-aarch64}、{@code darwin-x86_64}、{@code darwin-aarch64}、
 * {@code windows-x86_64}。
 *
 * <h2>依赖链</h2>
 * 桥接库 {@code gmkitsm9} 依赖 GmSSL 的 {@code gmssl} 动态库，因此必须先加载 {@code gmssl}：
 * <ul>
 *     <li>Linux：{@code libgmssl.so.3} → {@code libgmkitsm9.so}</li>
 *     <li>macOS：{@code libgmssl.3.dylib} → {@code libgmkitsm9.dylib}</li>
 *     <li>Windows：{@code gmssl.dll} → {@code gmkitsm9.dll}</li>
 * </ul>
 */
final class SM9NativeLoader {

    /**
     * 指定桥接库绝对路径的系统属性名。
     */
    static final String NATIVE_PATH_PROPERTY = "gmkit.sm9.native.path";

    /**
     * 桥接库基础名（不含平台前后缀）。
     */
    static final String BRIDGE_LIB_NAME = "gmkitsm9";

    private static final String RESOURCE_ROOT = "native";

    private static boolean loaded;

    private SM9NativeLoader() {
    }

    /**
     * 加载 SM9 native 库；该方法幂等，重复调用只会加载一次。
     *
     * @throws SM9UnsupportedPlatformException 当前平台不支持或无可用 native 库
     * @throws SM9Exception                    加载过程中发生 IO 或链接错误
     */
    static synchronized void load() {
        if (loaded) {
            return;
        }

        // 1. 显式指定的绝对路径。
        String explicit = System.getProperty(NATIVE_PATH_PROPERTY);
        if (explicit != null && !explicit.trim().isEmpty()) {
            loadFromExplicitPath(explicit.trim());
            loaded = true;
            return;
        }

        // 2. 系统已安装（java.library.path）。
        try {
            System.loadLibrary(BRIDGE_LIB_NAME);
            loaded = true;
            return;
        } catch (Throwable ignored) {
            // 回退到 JAR 内置资源。
        }

        // 3. JAR 内置资源。
        loadFromResources();
        loaded = true;
    }

    private static void loadFromExplicitPath(String path) {
        Path bridge = java.nio.file.Paths.get(path);
        Path dir = bridge.toAbsolutePath().getParent();
        if (dir != null) {
            // 尝试从同目录预加载 gmssl 依赖（若不存在则忽略，可能已在系统路径）。
            tryLoadFromFile(dir.resolve(dependencyLibFileName()));
        }
        try {
            System.load(bridge.toAbsolutePath().toString());
        } catch (Throwable t) {
            throw new SM9Exception(SM9Messages.nativeUnavailable(t), t);
        }
    }

    private static void loadFromResources() {
        String platform = detectPlatform();
        Path tempDir;
        try {
            tempDir = Files.createTempDirectory("gmkit-sm9-");
        } catch (IOException e) {
            throw new SM9Exception(SM9Messages.nativeUnavailable(e), e);
        }
        tempDir.toFile().deleteOnExit();

        // 先解压并预加载 gmssl 依赖库（若资源存在）。
        String dependency = dependencyLibFileName();
        Path dependencyFile = extractIfPresent(platform, dependency, tempDir);
        if (dependencyFile != null) {
            tryLoadFromFile(dependencyFile);
        }

        // 再解压并加载桥接库。
        String bridge = bridgeLibFileName();
        Path bridgeFile = extractIfPresent(platform, bridge, tempDir);
        if (bridgeFile == null) {
            throw new SM9UnsupportedPlatformException(
                    SM9Messages.nativeUnavailable(new IllegalStateException(
                            "缺少 native 资源 / missing native resource: "
                                    + RESOURCE_ROOT + "/" + platform + "/" + bridge)));
        }
        try {
            System.load(bridgeFile.toAbsolutePath().toString());
        } catch (Throwable t) {
            throw new SM9Exception(SM9Messages.nativeUnavailable(t), t);
        }
    }

    private static Path extractIfPresent(String platform, String fileName, Path targetDir) {
        String resource = RESOURCE_ROOT + "/" + platform + "/" + fileName;
        ClassLoader loader = SM9NativeLoader.class.getClassLoader();
        try (InputStream in = loader.getResourceAsStream(resource)) {
            if (in == null) {
                return null;
            }
            Path target = targetDir.resolve(fileName);
            try (OutputStream out = Files.newOutputStream(target)) {
                copy(in, out);
            }
            target.toFile().deleteOnExit();
            return target;
        } catch (IOException e) {
            throw new SM9Exception(SM9Messages.nativeUnavailable(e), e);
        }
    }

    private static void copy(InputStream in, OutputStream out) throws IOException {
        // 使用固定缓冲区复制，兼容 JDK 8。
        byte[] buffer = new byte[8192];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        out.flush();
    }

    private static void tryLoadFromFile(Path file) {
        if (file == null || !Files.exists(file)) {
            return;
        }
        try {
            System.load(file.toAbsolutePath().toString());
        } catch (Throwable ignored) {
            // 依赖库可能已经在系统路径中可用；交由后续桥接库加载阶段决定成败。
        }
    }

    /**
     * 探测当前平台标识，例如 {@code linux-x86_64}。
     *
     * @return 平台标识
     * @throws SM9UnsupportedPlatformException 无法识别的操作系统或架构
     */
    static String detectPlatform() {
        String os = osToken();
        String arch = archToken();
        return os + "-" + arch;
    }

    private static String osToken() {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (osName.contains("linux")) {
            return "linux";
        }
        if (osName.contains("mac") || osName.contains("darwin")) {
            return "darwin";
        }
        if (osName.contains("windows")) {
            return "windows";
        }
        throw new SM9UnsupportedPlatformException(
                SM9Messages.nativeUnavailable(new IllegalStateException(
                        "不支持的操作系统 / unsupported OS: " + osName)));
    }

    private static String archToken() {
        String arch = System.getProperty("os.arch", "").toLowerCase(Locale.ROOT);
        if (arch.equals("amd64") || arch.equals("x86_64") || arch.equals("x64")) {
            return "x86_64";
        }
        if (arch.equals("aarch64") || arch.equals("arm64")) {
            return "aarch64";
        }
        throw new SM9UnsupportedPlatformException(
                SM9Messages.nativeUnavailable(new IllegalStateException(
                        "不支持的 CPU 架构 / unsupported CPU arch: " + arch)));
    }

    private static String bridgeLibFileName() {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (osName.contains("windows")) {
            return BRIDGE_LIB_NAME + ".dll";
        }
        if (osName.contains("mac") || osName.contains("darwin")) {
            return "lib" + BRIDGE_LIB_NAME + ".dylib";
        }
        return "lib" + BRIDGE_LIB_NAME + ".so";
    }

    private static String dependencyLibFileName() {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (osName.contains("windows")) {
            return "gmssl.dll";
        }
        if (osName.contains("mac") || osName.contains("darwin")) {
            return "libgmssl.3.dylib";
        }
        return "libgmssl.so.3";
    }
}
