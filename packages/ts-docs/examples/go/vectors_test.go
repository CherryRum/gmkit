package examples

import (
	"encoding/hex"
	"testing"

	"github.com/emmansun/gmsm/sm3"
	"github.com/emmansun/gmsm/sm4"
)

func TestStandardVectors(t *testing.T) {
	digest := sm3.Sum([]byte("abc"))
	if got := hex.EncodeToString(digest[:]); got != "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0" {
		t.Fatalf("SM3 vector mismatch: %s", got)
	}

	key, _ := hex.DecodeString("0123456789abcdeffedcba9876543210")
	plain, _ := hex.DecodeString("0123456789abcdeffedcba9876543210")
	block, err := sm4.NewCipher(key)
	if err != nil {
		t.Fatal(err)
	}
	ciphertext := make([]byte, block.BlockSize())
	block.Encrypt(ciphertext, plain)
	if got := hex.EncodeToString(ciphertext); got != "681edf34d206965e86b3e94f536e4246" {
		t.Fatalf("SM4 vector mismatch: %s", got)
	}
}
