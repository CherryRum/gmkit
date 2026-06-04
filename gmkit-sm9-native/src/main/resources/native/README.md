# SM9 native 库目录

本目录按 `平台标识` 存放各平台的 SM9 native 库，运行时由
`cn.gmkit.sm9.SM9NativeLoader` 按 `os.name` / `os.arch` 自动选择并解压加载。

## 目录结构

```
native/
├── linux-x86_64/     libgmkitsm9.so   + libgmssl.so.3
├── linux-aarch64/    libgmkitsm9.so   + libgmssl.so.3
├── darwin-x86_64/    libgmkitsm9.dylib + libgmssl.3.dylib
├── darwin-aarch64/   libgmkitsm9.dylib + libgmssl.3.dylib
└── windows-x86_64/   gmkitsm9.dll     + gmssl.dll
```

每个平台目录包含两类文件：

| 文件 | 说明 |
|------|------|
| `gmkitsm9`（桥接库） | 由 `src/main/c/gmkitsm9.c` 编译，实现 JNI 方法 |
| `gmssl`（依赖库） | GmSSL v3.1.1 的运行时共享库，桥接库依赖它 |

## 为什么仓库里没有预编译产物

native 二进制由 CI（`.github/workflows/build-native.yml`）在各平台从
GmSSL v3.1.1 源码编译后产出，不直接提交到版本库；发布时再下载并打入 JAR。

如需本地构建，请参考根目录 README 的「SM9 本地编译」一节，或执行：

```bash
mvn -pl gmkit-sm9-native -Pnative-build -Dgmssl.root=/usr/local process-classes
```

构建产物位于 `target/native-build/`，将 `gmkitsm9` 与 `gmssl` 两个库复制到对应
平台目录后即可被打包加载。
