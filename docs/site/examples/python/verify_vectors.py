from gmssl import func, sm3, sm4


def require_equal(label: str, actual: str, expected: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label} vector mismatch: {actual}")


require_equal(
    "SM3",
    sm3.sm3_hash(func.bytes_to_list(b"abc")),
    "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
)

key = bytes.fromhex("0123456789abcdeffedcba9876543210")
plain = bytes.fromhex("0123456789abcdeffedcba9876543210")
# crypt_ecb 会自行填充；这里只取第一个分组来核对 GB/T 32907 固定向量。
cipher = sm4.CryptSM4()
cipher.set_key(key, sm4.SM4_ENCRYPT)
ciphertext = bytes(cipher.crypt_ecb(plain))
require_equal("SM4", ciphertext[:16].hex(), "681edf34d206965e86b3e94f536e4246")

print("Python gmssl SM3/SM4 示例通过")
