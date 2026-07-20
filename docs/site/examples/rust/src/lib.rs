#[cfg(test)]
mod tests {
    use hex_literal::hex;
    use sm3::{Digest, Sm3};
    use sm4::cipher::{BlockCipherEncrypt, KeyInit};
    use sm4::Sm4;

    #[test]
    fn verifies_standard_vectors() {
        let digest = Sm3::digest(b"abc");
        assert_eq!(digest[..], hex!("66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0"));

        let cipher = Sm4::new(&hex!("0123456789abcdeffedcba9876543210").into());
        let mut block = hex!("0123456789abcdeffedcba9876543210").into();
        cipher.encrypt_block(&mut block);
        assert_eq!(block[..], hex!("681edf34d206965e86b3e94f536e4246"));
    }
}
