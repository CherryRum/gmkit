package cn.gmkit.sm9;

/**
 * 当当前操作系统 / CPU 架构没有可用的 SM9 native 库时抛出。
 * <p>
 * 该异常继承自 {@link SM9Exception}，因此既可以单独捕获以区分“平台不支持”，
 * 也可以与其它 SM9 错误一起按 {@link SM9Exception} 统一处理。
 */
public class SM9UnsupportedPlatformException extends SM9Exception {

    /**
     * 使用错误消息创建异常。
     *
     * @param message 错误消息
     */
    public SM9UnsupportedPlatformException(String message) {
        super(message);
    }

    /**
     * 使用错误消息和根因创建异常。
     *
     * @param message 错误消息
     * @param cause   根因异常
     */
    public SM9UnsupportedPlatformException(String message, Throwable cause) {
        super(message, cause);
    }
}
