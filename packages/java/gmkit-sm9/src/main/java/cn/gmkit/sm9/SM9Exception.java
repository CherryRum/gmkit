package cn.gmkit.sm9;

/**
 * SM9 模块运行时异常。
 * <p>
 * SM9 通过 JNI 桥接 GmSSL native 实现，参数错误、native 库加载失败、签名/验签失败、
 * 加解密失败以及密钥导入导出失败等场景都会统一抛出该异常，便于业务侧集中兜底。
 */
public class SM9Exception extends RuntimeException {

    /**
     * 使用错误消息创建异常。
     *
     * @param message 错误消息
     */
    public SM9Exception(String message) {
        super(message);
    }

    /**
     * 使用错误消息和根因创建异常。
     *
     * @param message 错误消息
     * @param cause   根因异常
     */
    public SM9Exception(String message, Throwable cause) {
        super(message, cause);
    }
}
