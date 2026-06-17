package cn.gmkit.core;

/**
 * GMKit 运行时异常。
 * <p>
 * 公开 API 的参数错误、编码错误、加解密失败和签名失败等场景都会尽量统一为这个异常类型，
 * 便于业务侧按一个入口兜底处理。
 */
public class GmkitException extends RuntimeException {

    /**
     * 使用错误消息创建异常。
     *
     * @param message 错误消息
     */
    public GmkitException(String message) {
        super(message);
    }

    /**
     * 使用错误消息和根因创建异常。
     *
     * @param message 错误消息
     * @param cause   根因异常
     */
    public GmkitException(String message, Throwable cause) {
        super(message, cause);
    }
}
