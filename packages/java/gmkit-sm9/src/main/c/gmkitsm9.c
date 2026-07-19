/*
 * GMKit SM9 JNI 桥接实现。
 *
 * 该文件实现 cn.gmkit.sm9.SM9NativeBridge 中声明的所有 native 方法，
 * 直接调用 GmSSL v3.1.1 的 SM9 C API。所有 SM9 native 资源以堆上分配的
 * 结构体指针形式（jlong 句柄）在 Java 与 C 之间传递，由 Java 层负责释放。
 *
 * 编译依赖：GmSSL v3.1.1（提供 <gmssl/sm9.h> 与共享库 gmssl）。
 */
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <stdint.h>
#include <jni.h>
#include <gmssl/sm9.h>
#include <gmssl/error.h>

/* 将 jlong 句柄还原为对应类型的指针。 */
#define HANDLE_PTR(type, handle) ((type *)(intptr_t)(handle))
#define PTR_HANDLE(ptr)          ((jlong)(intptr_t)(ptr))

/* ------------------------------------------------------------------ */
/* 内部小工具                                                          */
/* ------------------------------------------------------------------ */

/* 打开文件；失败返回 NULL。 */
static FILE *open_file(JNIEnv *env, jstring jfile, const char *mode)
{
	const char *path;
	FILE *fp;

	if (jfile == NULL) {
		return NULL;
	}
	path = (*env)->GetStringUTFChars(env, jfile, NULL);
	if (path == NULL) {
		return NULL;
	}
	fp = fopen(path, mode);
	(*env)->ReleaseStringUTFChars(env, jfile, path);
	return fp;
}

/* ------------------------------------------------------------------ */
/* 签名主密钥                                                          */
/* ------------------------------------------------------------------ */

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterKeyGenerate(JNIEnv *env, jclass cls)
{
	SM9_SIGN_MASTER_KEY *msk = (SM9_SIGN_MASTER_KEY *)calloc(1, sizeof(SM9_SIGN_MASTER_KEY));
	if (msk == NULL) {
		return 0;
	}
	if (sm9_sign_master_key_generate(msk) != 1) {
		free(msk);
		return 0;
	}
	return PTR_HANDLE(msk);
}

JNIEXPORT void JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterKeyFree(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_SIGN_MASTER_KEY *msk = HANDLE_PTR(SM9_SIGN_MASTER_KEY, handle);
	if (msk != NULL) {
		memset(msk, 0, sizeof(SM9_SIGN_MASTER_KEY));
		free(msk);
	}
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterKeyInfoEncryptToPem(JNIEnv *env, jclass cls,
		jlong handle, jstring jpass, jstring jfile)
{
	SM9_SIGN_MASTER_KEY *msk = HANDLE_PTR(SM9_SIGN_MASTER_KEY, handle);
	const char *pass;
	FILE *fp;
	int ret;

	if (msk == NULL || jpass == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "wb");
	if (fp == NULL) {
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		return 0;
	}
	ret = sm9_sign_master_key_info_encrypt_to_pem(msk, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterKeyInfoDecryptFromPem(JNIEnv *env, jclass cls,
		jstring jpass, jstring jfile)
{
	SM9_SIGN_MASTER_KEY *msk;
	const char *pass;
	FILE *fp;
	int ret;

	if (jpass == NULL) {
		return 0;
	}
	msk = (SM9_SIGN_MASTER_KEY *)calloc(1, sizeof(SM9_SIGN_MASTER_KEY));
	if (msk == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "rb");
	if (fp == NULL) {
		memset(msk, 0, sizeof(SM9_SIGN_MASTER_KEY));
		free(msk);
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		memset(msk, 0, sizeof(SM9_SIGN_MASTER_KEY));
		free(msk);
		return 0;
	}
	ret = sm9_sign_master_key_info_decrypt_from_pem(msk, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	if (ret != 1) {
		memset(msk, 0, sizeof(SM9_SIGN_MASTER_KEY));
		free(msk);
		return 0;
	}
	return PTR_HANDLE(msk);
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterPublicKeyToPem(JNIEnv *env, jclass cls,
		jlong handle, jstring jfile)
{
	SM9_SIGN_MASTER_KEY *mpk = HANDLE_PTR(SM9_SIGN_MASTER_KEY, handle);
	FILE *fp;
	int ret;

	if (mpk == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "wb");
	if (fp == NULL) {
		return 0;
	}
	ret = sm9_sign_master_public_key_to_pem(mpk, fp);
	fclose(fp);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterPublicKeyFromPem(JNIEnv *env, jclass cls,
		jstring jfile)
{
	SM9_SIGN_MASTER_KEY *mpk;
	FILE *fp;
	int ret;

	mpk = (SM9_SIGN_MASTER_KEY *)calloc(1, sizeof(SM9_SIGN_MASTER_KEY));
	if (mpk == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "rb");
	if (fp == NULL) {
		free(mpk);
		return 0;
	}
	ret = sm9_sign_master_public_key_from_pem(mpk, fp);
	fclose(fp);
	if (ret != 1) {
		free(mpk);
		return 0;
	}
	return PTR_HANDLE(mpk);
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignMasterKeyExtractKey(JNIEnv *env, jclass cls,
		jlong handle, jbyteArray jid)
{
	SM9_SIGN_MASTER_KEY *msk = HANDLE_PTR(SM9_SIGN_MASTER_KEY, handle);
	SM9_SIGN_KEY *key;
	jbyte *id;
	jsize idlen;
	int ret;

	if (msk == NULL || jid == NULL) {
		return 0;
	}
	key = (SM9_SIGN_KEY *)calloc(1, sizeof(SM9_SIGN_KEY));
	if (key == NULL) {
		return 0;
	}
	idlen = (*env)->GetArrayLength(env, jid);
	if (idlen <= 0) {
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
		return 0;
	}
	id = (*env)->GetByteArrayElements(env, jid, NULL);
	if (id == NULL) {
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
		return 0;
	}
	ret = sm9_sign_master_key_extract_key(msk, (const char *)id, (size_t)idlen, key);
	(*env)->ReleaseByteArrayElements(env, jid, id, JNI_ABORT);
	if (ret != 1) {
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
		return 0;
	}
	return PTR_HANDLE(key);
}

/* ------------------------------------------------------------------ */
/* 用户签名私钥                                                        */
/* ------------------------------------------------------------------ */

JNIEXPORT void JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignKeyFree(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_SIGN_KEY *key = HANDLE_PTR(SM9_SIGN_KEY, handle);
	if (key != NULL) {
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
	}
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignKeyInfoEncryptToPem(JNIEnv *env, jclass cls,
		jlong handle, jstring jpass, jstring jfile)
{
	SM9_SIGN_KEY *key = HANDLE_PTR(SM9_SIGN_KEY, handle);
	const char *pass;
	FILE *fp;
	int ret;

	if (key == NULL || jpass == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "wb");
	if (fp == NULL) {
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		return 0;
	}
	ret = sm9_sign_key_info_encrypt_to_pem(key, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignKeyInfoDecryptFromPem(JNIEnv *env, jclass cls,
		jstring jpass, jstring jfile)
{
	SM9_SIGN_KEY *key;
	const char *pass;
	FILE *fp;
	int ret;

	if (jpass == NULL) {
		return 0;
	}
	key = (SM9_SIGN_KEY *)calloc(1, sizeof(SM9_SIGN_KEY));
	if (key == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "rb");
	if (fp == NULL) {
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
		return 0;
	}
	ret = sm9_sign_key_info_decrypt_from_pem(key, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	if (ret != 1) {
		memset(key, 0, sizeof(SM9_SIGN_KEY));
		free(key);
		return 0;
	}
	return PTR_HANDLE(key);
}

/* ------------------------------------------------------------------ */
/* 签名 / 验签上下文                                                   */
/* ------------------------------------------------------------------ */

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignCtxNew(JNIEnv *env, jclass cls)
{
	SM9_SIGN_CTX *ctx = (SM9_SIGN_CTX *)calloc(1, sizeof(SM9_SIGN_CTX));
	return PTR_HANDLE(ctx);
}

JNIEXPORT void JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignCtxFree(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, handle);
	if (ctx != NULL) {
		memset(ctx, 0, sizeof(SM9_SIGN_CTX));
		free(ctx);
	}
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignInit(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, handle);
	if (ctx == NULL) {
		return 0;
	}
	return sm9_sign_init(ctx) == 1 ? 1 : 0;
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignUpdate(JNIEnv *env, jclass cls,
		jlong handle, jbyteArray jdata, jint offset, jint length)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, handle);
	jbyte *data;
	jsize data_len;
	int ret;

	if (ctx == NULL || jdata == NULL || length < 0 || offset < 0) {
		return 0;
	}
	data_len = (*env)->GetArrayLength(env, jdata);
	if (offset > data_len || length > data_len - offset) {
		return 0;
	}
	data = (*env)->GetByteArrayElements(env, jdata, NULL);
	if (data == NULL) {
		return 0;
	}
	ret = sm9_sign_update(ctx, (const uint8_t *)(data + offset), (size_t)length);
	(*env)->ReleaseByteArrayElements(env, jdata, data, JNI_ABORT);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jbyteArray JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9SignFinish(JNIEnv *env, jclass cls,
		jlong ctxHandle, jlong keyHandle)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, ctxHandle);
	SM9_SIGN_KEY *key = HANDLE_PTR(SM9_SIGN_KEY, keyHandle);
	uint8_t sig[SM9_SIGNATURE_SIZE];
	size_t siglen = 0;
	jbyteArray result;

	if (ctx == NULL || key == NULL) {
		return NULL;
	}
	if (sm9_sign_finish(ctx, key, sig, &siglen) != 1) {
		return NULL;
	}
	result = (*env)->NewByteArray(env, (jsize)siglen);
	if (result == NULL) {
		return NULL;
	}
	(*env)->SetByteArrayRegion(env, result, 0, (jsize)siglen, (const jbyte *)sig);
	return result;
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9VerifyInit(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, handle);
	if (ctx == NULL) {
		return 0;
	}
	return sm9_verify_init(ctx) == 1 ? 1 : 0;
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9VerifyUpdate(JNIEnv *env, jclass cls,
		jlong handle, jbyteArray jdata, jint offset, jint length)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, handle);
	jbyte *data;
	jsize data_len;
	int ret;

	if (ctx == NULL || jdata == NULL || length < 0 || offset < 0) {
		return 0;
	}
	data_len = (*env)->GetArrayLength(env, jdata);
	if (offset > data_len || length > data_len - offset) {
		return 0;
	}
	data = (*env)->GetByteArrayElements(env, jdata, NULL);
	if (data == NULL) {
		return 0;
	}
	ret = sm9_verify_update(ctx, (const uint8_t *)(data + offset), (size_t)length);
	(*env)->ReleaseByteArrayElements(env, jdata, data, JNI_ABORT);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9VerifyFinish(JNIEnv *env, jclass cls,
		jlong ctxHandle, jbyteArray jsig, jlong mpkHandle, jbyteArray jid)
{
	SM9_SIGN_CTX *ctx = HANDLE_PTR(SM9_SIGN_CTX, ctxHandle);
	SM9_SIGN_MASTER_KEY *mpk = HANDLE_PTR(SM9_SIGN_MASTER_KEY, mpkHandle);
	jbyte *sig;
	jsize siglen;
	jbyte *id;
	jsize idlen;
	int ret;

	if (ctx == NULL || mpk == NULL || jsig == NULL || jid == NULL) {
		return 0;
	}
	siglen = (*env)->GetArrayLength(env, jsig);
	sig = (*env)->GetByteArrayElements(env, jsig, NULL);
	if (sig == NULL) {
		return 0;
	}
	idlen = (*env)->GetArrayLength(env, jid);
	if (idlen <= 0) {
		(*env)->ReleaseByteArrayElements(env, jsig, sig, JNI_ABORT);
		return 0;
	}
	id = (*env)->GetByteArrayElements(env, jid, NULL);
	if (id == NULL) {
		(*env)->ReleaseByteArrayElements(env, jsig, sig, JNI_ABORT);
		return 0;
	}
	ret = sm9_verify_finish(ctx, (const uint8_t *)sig, (size_t)siglen,
		mpk, (const char *)id, (size_t)idlen);
	(*env)->ReleaseByteArrayElements(env, jid, id, JNI_ABORT);
	(*env)->ReleaseByteArrayElements(env, jsig, sig, JNI_ABORT);
	return ret == 1 ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* 加密主密钥                                                          */
/* ------------------------------------------------------------------ */

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterKeyGenerate(JNIEnv *env, jclass cls)
{
	SM9_ENC_MASTER_KEY *msk = (SM9_ENC_MASTER_KEY *)calloc(1, sizeof(SM9_ENC_MASTER_KEY));
	if (msk == NULL) {
		return 0;
	}
	if (sm9_enc_master_key_generate(msk) != 1) {
		memset(msk, 0, sizeof(SM9_ENC_MASTER_KEY));
		free(msk);
		return 0;
	}
	return PTR_HANDLE(msk);
}

JNIEXPORT void JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterKeyFree(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_ENC_MASTER_KEY *msk = HANDLE_PTR(SM9_ENC_MASTER_KEY, handle);
	if (msk != NULL) {
		memset(msk, 0, sizeof(SM9_ENC_MASTER_KEY));
		free(msk);
	}
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterKeyInfoEncryptToPem(JNIEnv *env, jclass cls,
		jlong handle, jstring jpass, jstring jfile)
{
	SM9_ENC_MASTER_KEY *msk = HANDLE_PTR(SM9_ENC_MASTER_KEY, handle);
	const char *pass;
	FILE *fp;
	int ret;

	if (msk == NULL || jpass == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "wb");
	if (fp == NULL) {
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		return 0;
	}
	ret = sm9_enc_master_key_info_encrypt_to_pem(msk, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterKeyInfoDecryptFromPem(JNIEnv *env, jclass cls,
		jstring jpass, jstring jfile)
{
	SM9_ENC_MASTER_KEY *msk;
	const char *pass;
	FILE *fp;
	int ret;

	if (jpass == NULL) {
		return 0;
	}
	msk = (SM9_ENC_MASTER_KEY *)calloc(1, sizeof(SM9_ENC_MASTER_KEY));
	if (msk == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "rb");
	if (fp == NULL) {
		memset(msk, 0, sizeof(SM9_ENC_MASTER_KEY));
		free(msk);
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		memset(msk, 0, sizeof(SM9_ENC_MASTER_KEY));
		free(msk);
		return 0;
	}
	ret = sm9_enc_master_key_info_decrypt_from_pem(msk, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	if (ret != 1) {
		memset(msk, 0, sizeof(SM9_ENC_MASTER_KEY));
		free(msk);
		return 0;
	}
	return PTR_HANDLE(msk);
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterPublicKeyToPem(JNIEnv *env, jclass cls,
		jlong handle, jstring jfile)
{
	SM9_ENC_MASTER_KEY *mpk = HANDLE_PTR(SM9_ENC_MASTER_KEY, handle);
	FILE *fp;
	int ret;

	if (mpk == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "wb");
	if (fp == NULL) {
		return 0;
	}
	ret = sm9_enc_master_public_key_to_pem(mpk, fp);
	fclose(fp);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterPublicKeyFromPem(JNIEnv *env, jclass cls,
		jstring jfile)
{
	SM9_ENC_MASTER_KEY *mpk;
	FILE *fp;
	int ret;

	mpk = (SM9_ENC_MASTER_KEY *)calloc(1, sizeof(SM9_ENC_MASTER_KEY));
	if (mpk == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "rb");
	if (fp == NULL) {
		free(mpk);
		return 0;
	}
	ret = sm9_enc_master_public_key_from_pem(mpk, fp);
	fclose(fp);
	if (ret != 1) {
		free(mpk);
		return 0;
	}
	return PTR_HANDLE(mpk);
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncMasterKeyExtractKey(JNIEnv *env, jclass cls,
		jlong handle, jbyteArray jid)
{
	SM9_ENC_MASTER_KEY *msk = HANDLE_PTR(SM9_ENC_MASTER_KEY, handle);
	SM9_ENC_KEY *key;
	jbyte *id;
	jsize idlen;
	int ret;

	if (msk == NULL || jid == NULL) {
		return 0;
	}
	key = (SM9_ENC_KEY *)calloc(1, sizeof(SM9_ENC_KEY));
	if (key == NULL) {
		return 0;
	}
	idlen = (*env)->GetArrayLength(env, jid);
	if (idlen <= 0) {
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
		return 0;
	}
	id = (*env)->GetByteArrayElements(env, jid, NULL);
	if (id == NULL) {
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
		return 0;
	}
	ret = sm9_enc_master_key_extract_key(msk, (const char *)id, (size_t)idlen, key);
	(*env)->ReleaseByteArrayElements(env, jid, id, JNI_ABORT);
	if (ret != 1) {
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
		return 0;
	}
	return PTR_HANDLE(key);
}

/* ------------------------------------------------------------------ */
/* 用户解密私钥                                                        */
/* ------------------------------------------------------------------ */

JNIEXPORT void JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncKeyFree(JNIEnv *env, jclass cls, jlong handle)
{
	SM9_ENC_KEY *key = HANDLE_PTR(SM9_ENC_KEY, handle);
	if (key != NULL) {
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
	}
}

JNIEXPORT jint JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncKeyInfoEncryptToPem(JNIEnv *env, jclass cls,
		jlong handle, jstring jpass, jstring jfile)
{
	SM9_ENC_KEY *key = HANDLE_PTR(SM9_ENC_KEY, handle);
	const char *pass;
	FILE *fp;
	int ret;

	if (key == NULL || jpass == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "wb");
	if (fp == NULL) {
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		return 0;
	}
	ret = sm9_enc_key_info_encrypt_to_pem(key, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	return ret == 1 ? 1 : 0;
}

JNIEXPORT jlong JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9EncKeyInfoDecryptFromPem(JNIEnv *env, jclass cls,
		jstring jpass, jstring jfile)
{
	SM9_ENC_KEY *key;
	const char *pass;
	FILE *fp;
	int ret;

	if (jpass == NULL) {
		return 0;
	}
	key = (SM9_ENC_KEY *)calloc(1, sizeof(SM9_ENC_KEY));
	if (key == NULL) {
		return 0;
	}
	fp = open_file(env, jfile, "rb");
	if (fp == NULL) {
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
		return 0;
	}
	pass = (*env)->GetStringUTFChars(env, jpass, NULL);
	if (pass == NULL) {
		fclose(fp);
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
		return 0;
	}
	ret = sm9_enc_key_info_decrypt_from_pem(key, pass, fp);
	(*env)->ReleaseStringUTFChars(env, jpass, pass);
	fclose(fp);
	if (ret != 1) {
		memset(key, 0, sizeof(SM9_ENC_KEY));
		free(key);
		return 0;
	}
	return PTR_HANDLE(key);
}

/* ------------------------------------------------------------------ */
/* 加密 / 解密（IBE）                                                  */
/* ------------------------------------------------------------------ */

JNIEXPORT jbyteArray JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9Encrypt(JNIEnv *env, jclass cls,
		jlong handle, jbyteArray jid, jbyteArray jin)
{
	SM9_ENC_MASTER_KEY *mpk = HANDLE_PTR(SM9_ENC_MASTER_KEY, handle);
	jbyte *id;
	jsize idlen;
	jbyte *in;
	jsize inlen;
	uint8_t out[SM9_MAX_CIPHERTEXT_SIZE];
	size_t outlen = 0;
	int ret;
	jbyteArray result;

	if (mpk == NULL || jid == NULL || jin == NULL) {
		return NULL;
	}
	inlen = (*env)->GetArrayLength(env, jin);
	if (inlen <= 0 || inlen > SM9_MAX_PLAINTEXT_SIZE) {
		return NULL;
	}
	in = (*env)->GetByteArrayElements(env, jin, NULL);
	if (in == NULL) {
		return NULL;
	}
	idlen = (*env)->GetArrayLength(env, jid);
	if (idlen <= 0) {
		(*env)->ReleaseByteArrayElements(env, jin, in, JNI_ABORT);
		return NULL;
	}
	id = (*env)->GetByteArrayElements(env, jid, NULL);
	if (id == NULL) {
		(*env)->ReleaseByteArrayElements(env, jin, in, JNI_ABORT);
		return NULL;
	}
	ret = sm9_encrypt(mpk, (const char *)id, (size_t)idlen,
		(const uint8_t *)in, (size_t)inlen, out, &outlen);
	(*env)->ReleaseByteArrayElements(env, jid, id, JNI_ABORT);
	(*env)->ReleaseByteArrayElements(env, jin, in, JNI_ABORT);
	if (ret != 1) {
		return NULL;
	}
	result = (*env)->NewByteArray(env, (jsize)outlen);
	if (result == NULL) {
		return NULL;
	}
	(*env)->SetByteArrayRegion(env, result, 0, (jsize)outlen, (const jbyte *)out);
	return result;
}

JNIEXPORT jbyteArray JNICALL
Java_cn_gmkit_sm9_SM9NativeBridge_sm9Decrypt(JNIEnv *env, jclass cls,
		jlong handle, jbyteArray jid, jbyteArray jin)
{
	SM9_ENC_KEY *key = HANDLE_PTR(SM9_ENC_KEY, handle);
	jbyte *id;
	jsize idlen;
	jbyte *in;
	jsize inlen;
	uint8_t out[SM9_MAX_PLAINTEXT_SIZE];
	size_t outlen = 0;
	int ret;
	jbyteArray result;

	if (key == NULL || jid == NULL || jin == NULL) {
		return NULL;
	}
	inlen = (*env)->GetArrayLength(env, jin);
	if (inlen <= 0) {
		return NULL;
	}
	in = (*env)->GetByteArrayElements(env, jin, NULL);
	if (in == NULL) {
		return NULL;
	}
	idlen = (*env)->GetArrayLength(env, jid);
	if (idlen <= 0) {
		(*env)->ReleaseByteArrayElements(env, jin, in, JNI_ABORT);
		return NULL;
	}
	id = (*env)->GetByteArrayElements(env, jid, NULL);
	if (id == NULL) {
		(*env)->ReleaseByteArrayElements(env, jin, in, JNI_ABORT);
		return NULL;
	}
	ret = sm9_decrypt(key, (const char *)id, (size_t)idlen,
		(const uint8_t *)in, (size_t)inlen, out, &outlen);
	(*env)->ReleaseByteArrayElements(env, jid, id, JNI_ABORT);
	(*env)->ReleaseByteArrayElements(env, jin, in, JNI_ABORT);
	if (ret != 1) {
		return NULL;
	}
	result = (*env)->NewByteArray(env, (jsize)outlen);
	if (result == NULL) {
		return NULL;
	}
	(*env)->SetByteArrayRegion(env, result, 0, (jsize)outlen, (const jbyte *)out);
	return result;
}
