<!--
  SM4 分组密码算法视图组件
  SM4 Block Cipher Algorithm View Component
  
  功能：
  1. 加密/解密 (Encrypt/Decrypt)
  2. 支持多种工作模式 (Support multiple cipher modes)
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { sm4Encrypt, sm4Decrypt, CipherMode } from 'gmkitx'

// ========== 密钥管理 Key Management ==========
// SM4密钥（128位，32个十六进制字符）SM4 key (128-bit, 32 hex characters)
const secretKey = ref('0123456789abcdeffedcba9876543210')

// 生成随机密钥 Generate random key
const generateRandomKey = () => {
  // 生成128位随机密钥 Generate 128-bit random key
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  secretKey.value = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  showSuccess('随机密钥生成成功！')
}

// ========== 加密/解密 Encryption/Decryption ==========
// 明文 Plaintext
const plaintext = ref('Hello, SM4!')
// 密文 Ciphertext
const ciphertext = ref('')
// 工作模式 Cipher mode
const cipherMode = ref<'ECB' | 'CBC' | 'CTR' | 'CFB' | 'OFB' | 'GCM'>('ECB')
// 初始化向量（CBC/CTR/CFB/OFB模式使用）Initialization Vector (used in CBC/CTR/CFB/OFB mode)
const iv = ref('0123456789abcdeffedcba9876543210')
// GCM模式的IV（12字节）GCM mode IV (12 bytes)
const gcmIV = ref('000000000000000000000000')
// GCM模式的附加认证数据 GCM mode Additional Authenticated Data
const aad = ref('')
// GCM模式的认证标签 GCM mode authentication tag
const authTag = ref('')

// 生成随机IV Generate random IV
const generateRandomIV = () => {
  // 生成128位随机IV Generate 128-bit random IV
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  iv.value = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  showSuccess('随机IV生成成功！')
}

// 生成GCM模式随机IV Generate random IV for GCM mode
const generateRandomGCMIV = () => {
  // 生成96位随机IV Generate 96-bit random IV
  const array = new Uint8Array(12)
  crypto.getRandomValues(array)
  gcmIV.value = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  showSuccess('随机GCM IV生成成功！')
}

// 是否显示IV输入 Whether to show IV input
const showIVInput = computed(() => ['CBC', 'CTR', 'CFB', 'OFB'].includes(cipherMode.value))
// 是否显示GCM相关输入 Whether to show GCM-related inputs
const showGCMInput = computed(() => cipherMode.value === 'GCM')
// 是否为流密码模式 Whether it's a stream cipher mode
const isStreamMode = computed(() => ['CTR', 'CFB', 'OFB', 'GCM'].includes(cipherMode.value))

// 工作模式映射 Cipher mode mapping
const modeMap: Record<typeof cipherMode.value, typeof CipherMode[keyof typeof CipherMode]> = {
  'ECB': CipherMode.ECB,
  'CBC': CipherMode.CBC,
  'CTR': CipherMode.CTR,
  'CFB': CipherMode.CFB,
  'OFB': CipherMode.OFB,
  'GCM': CipherMode.GCM
}

// 加密操作 Encrypt operation
const encryptText = () => {
  if (!secretKey.value) {
    showError('请输入密钥！')
    return
  }
  
  if (secretKey.value.length !== 32) {
    showError('密钥长度必须为32个十六进制字符（128位）！')
    return
  }
  
  if (!plaintext.value) {
    showError('请输入要加密的文本！')
    return
  }
  
  // CBC模式需要IV CBC mode requires IV
  if (cipherMode.value === 'CBC') {
    if (!iv.value || iv.value.length !== 32) {
      showError('CBC模式需要32个十六进制字符（128位）的IV！')
      return
    }
  }
  
  try {
    // 执行SM4加密 Perform SM4 encryption
    const mode = modeMap[cipherMode.value]
    
    const options: { mode: typeof mode; iv?: string; aad?: string } = { mode }
    
    // 添加IV（非ECB模式）Add IV (non-ECB modes)
    if (mode === CipherMode.GCM) {
      options.iv = gcmIV.value
      if (aad.value) {
        options.aad = aad.value
      }
    } else if (mode !== CipherMode.ECB) {
      options.iv = iv.value
    }
    
    const encrypted = sm4Encrypt(secretKey.value, plaintext.value, options)
    ciphertext.value = encrypted.ciphertext
    authTag.value = encrypted.tag || ''
    showSuccess(encrypted.tag ? '加密成功！认证标签已生成。' : '加密成功！')
  } catch (error) {
    showError('加密失败：' + (error as Error).message)
  }
}

// 解密操作 Decrypt operation
const decryptText = () => {
  if (!secretKey.value) {
    showError('请输入密钥！')
    return
  }
  
  if (secretKey.value.length !== 32) {
    showError('密钥长度必须为32个十六进制字符（128位）！')
    return
  }
  
  if (!ciphertext.value) {
    showError('请先执行加密操作或输入密文！')
    return
  }
  
  // CBC/CTR/CFB/OFB模式需要IV CBC/CTR/CFB/OFB mode requires IV
  if (['CBC', 'CTR', 'CFB', 'OFB'].includes(cipherMode.value)) {
    if (!iv.value || iv.value.length !== 32) {
      showError(`${cipherMode.value}模式需要32个十六进制字符（128位）的IV！`)
      return
    }
  }
  
  // GCM模式需要12字节IV和认证标签 GCM mode requires 12-byte IV and auth tag
  if (cipherMode.value === 'GCM') {
    if (!gcmIV.value || gcmIV.value.length !== 24) {
      showError('GCM模式需要24个十六进制字符（96位）的IV！')
      return
    }
    if (!authTag.value) {
      showError('GCM模式需要认证标签！请先执行加密操作。')
      return
    }
  }
  
  try {
    // 执行SM4解密 Perform SM4 decryption
    const mode = modeMap[cipherMode.value]
    
    const options: { mode: typeof mode; iv?: string; aad?: string; tag?: string } = { mode }
    
    // 添加IV和其他参数 Add IV and other parameters
    if (mode === CipherMode.GCM) {
      options.iv = gcmIV.value
      options.tag = authTag.value
      if (aad.value) {
        options.aad = aad.value
      }
    } else if (mode !== CipherMode.ECB) {
      options.iv = iv.value
    }
    
    const decrypted = sm4Decrypt(secretKey.value, ciphertext.value, options)
    plaintext.value = decrypted
    showSuccess('解密成功！')
  } catch (error) {
    showError('解密失败：' + (error as Error).message)
  }
}

// ========== 消息提示 Message notifications ==========
const messageText = ref('')
const messageType = ref<'success' | 'error'>('success')
const showMessage = ref(false)

// 显示成功消息 Show success message
const showSuccess = (msg: string) => {
  messageText.value = msg
  messageType.value = 'success'
  showMessage.value = true
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}

// 显示错误消息 Show error message
const showError = (msg: string) => {
  messageText.value = msg
  messageType.value = 'error'
  showMessage.value = true
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}
</script>

<template>
  <div class="sm4-view">
    <!-- 页面标题 Page title -->
    <div class="page-header">
      <h1>🛡️ SM4 分组密码算法</h1>
      <p class="page-description">
        SM4 是中国国家密码管理局发布的对称加密算法，分组长度为 128 位。
        适用于数据加密、安全通信等场景，支持ECB和CBC等多种工作模式。
      </p>
    </div>

    <!-- 消息提示 Message notification -->
    <transition name="slide-down">
      <div v-if="showMessage" :class="['message', messageType]">
        {{ messageText }}
      </div>
    </transition>

    <!-- 密钥管理区域 Key management section -->
    <div class="section">
      <h2 class="section-title">🔑 密钥管理</h2>
      <div class="section-content">
        <div class="button-group">
          <button class="btn btn-primary" @click="generateRandomKey">🎲 生成随机密钥</button>
        </div>
        
        <!-- 密钥输入 Key input -->
        <div class="form-group">
          <label for="secret-key">密钥 (Key)：</label>
          <input 
            id="secret-key"
            v-model="secretKey" 
            type="text" 
            class="input" 
            placeholder="输入32个十六进制字符（128位）"
            maxlength="32"
          >
          <p class="hint">💡 SM4使用128位（16字节）密钥，即32个十六进制字符</p>
        </div>
      </div>
    </div>

    <!-- 加密/解密区域 Encryption/Decryption section -->
    <div class="section">
      <h2 class="section-title">🔒 加密/解密</h2>
      <div class="section-content">
        <!-- 工作模式选择 Cipher mode selection -->
        <div class="form-group">
          <label>工作模式 (Cipher Mode)：</label>
          <div class="radio-group">
            <label class="radio-label">
              <input 
                v-model="cipherMode" 
                type="radio" 
                value="ECB" 
                class="radio-input"
              >
              <span class="radio-text">ECB（电子密码本）</span>
            </label>
            <label class="radio-label">
              <input 
                v-model="cipherMode" 
                type="radio" 
                value="CBC" 
                class="radio-input"
              >
              <span class="radio-text">CBC（分组链接）</span>
            </label>
            <label class="radio-label">
              <input 
                v-model="cipherMode" 
                type="radio" 
                value="CTR" 
                class="radio-input"
              >
              <span class="radio-text">CTR（计数器模式）</span>
            </label>
            <label class="radio-label">
              <input 
                v-model="cipherMode" 
                type="radio" 
                value="CFB" 
                class="radio-input"
              >
              <span class="radio-text">CFB（密文反馈）</span>
            </label>
            <label class="radio-label">
              <input 
                v-model="cipherMode" 
                type="radio" 
                value="OFB" 
                class="radio-input"
              >
              <span class="radio-text">OFB（输出反馈）</span>
            </label>
            <label class="radio-label">
              <input 
                v-model="cipherMode" 
                type="radio" 
                value="GCM" 
                class="radio-input"
              >
              <span class="radio-text">GCM（认证加密）</span>
            </label>
          </div>
          <p class="hint">💡 ECB模式不推荐用于生产环境。推荐使用CBC、CTR或GCM模式。GCM模式提供认证加密功能。</p>
        </div>
        
        <!-- IV输入（CBC/CTR/CFB/OFB模式） IV input (CBC/CTR/CFB/OFB mode) -->
        <div v-if="showIVInput" class="form-group">
          <label for="iv">初始化向量 (IV)：</label>
          <div class="input-with-button">
            <input 
              id="iv"
              v-model="iv" 
              type="text" 
              class="input" 
              placeholder="输入32个十六进制字符（128位）"
              maxlength="32"
            >
            <button class="btn btn-small" @click="generateRandomIV">生成随机IV</button>
          </div>
          <p class="hint">💡 IV用于增强密文的随机性，每次加密应使用不同的IV</p>
        </div>
        
        <!-- GCM模式输入 GCM mode input -->
        <div v-if="showGCMInput" class="form-group">
          <label for="gcm-iv">初始化向量 (IV - GCM)：</label>
          <div class="input-with-button">
            <input 
              id="gcm-iv"
              v-model="gcmIV" 
              type="text" 
              class="input" 
              placeholder="输入24个十六进制字符（96位）"
              maxlength="24"
            >
            <button class="btn btn-small" @click="generateRandomGCMIV">生成随机IV</button>
          </div>
          <p class="hint">💡 GCM模式使用96位（12字节）IV，提供认证加密功能</p>
        </div>
        
        <div v-if="showGCMInput" class="form-group">
          <label for="aad">附加认证数据 (AAD - 可选)：</label>
          <input 
            id="aad"
            v-model="aad" 
            type="text" 
            class="input" 
            placeholder="输入附加认证数据（可选）"
          >
          <p class="hint">💡 AAD是不需要加密但需要认证的数据，如协议头信息</p>
        </div>
        
        <div v-if="showGCMInput && authTag" class="form-group">
          <label for="auth-tag">认证标签 (Authentication Tag)：</label>
          <input 
            id="auth-tag"
            v-model="authTag" 
            type="text" 
            class="input" 
            placeholder="认证标签（加密后自动生成）"
            readonly
          >
          <p class="hint">💡 认证标签用于验证数据完整性和真实性</p>
        </div>
        
        <!-- 明文输入 Plaintext input -->
        <div class="form-group">
          <label for="plaintext">明文 (Plaintext)：</label>
          <textarea 
            id="plaintext"
            v-model="plaintext" 
            class="textarea" 
            placeholder="输入要加密的文本..."
            rows="4"
          ></textarea>
        </div>
        
        <!-- 操作按钮 Action buttons -->
        <div class="button-group">
          <button class="btn btn-primary" @click="encryptText">🔒 加密</button>
          <button class="btn btn-secondary" @click="decryptText">🔓 解密</button>
        </div>
        
        <!-- 密文显示 Ciphertext display -->
        <div class="form-group">
          <label for="ciphertext">密文 (Ciphertext)：</label>
          <textarea 
            id="ciphertext"
            v-model="ciphertext" 
            class="textarea" 
            placeholder="加密后的密文将显示在这里..."
            rows="4"
          ></textarea>
          <p class="hint">💡 密文为十六进制格式，可直接用于解密操作</p>
        </div>
      </div>
    </div>

    <!-- 算法说明区域 Algorithm description section -->
    <div class="section info-section">
      <h2 class="section-title">ℹ️ 算法说明</h2>
      <div class="section-content">
        <div class="info-grid">
          <div class="info-item">
            <h3>🔹 算法特点</h3>
            <ul>
              <li>分组长度：128 位（16 字节）</li>
              <li>密钥长度：128 位（16 字节）</li>
              <li>迭代轮数：32 轮</li>
              <li>算法结构：非平衡Feistel结构</li>
            </ul>
          </div>
          
          <div class="info-item">
            <h3>🔹 工作模式</h3>
            <ul>
              <li>ECB：电子密码本模式（不推荐）</li>
              <li>CBC：密码分组链接模式</li>
              <li>CTR：计数器模式（流密码）</li>
              <li>CFB：密文反馈模式（流密码）</li>
              <li>OFB：输出反馈模式（流密码）</li>
              <li>GCM：认证加密模式（推荐）</li>
            </ul>
          </div>
          
          <div class="info-item">
            <h3>🔹 应用场景</h3>
            <ul>
              <li>数据加密存储</li>
              <li>安全通信传输</li>
              <li>文件加密保护</li>
              <li>金融交易加密</li>
            </ul>
          </div>
          
          <div class="info-item">
            <h3>🔹 标准规范</h3>
            <ul>
              <li>国家标准：GM/T 0002-2012</li>
              <li>发布机构：国家密码管理局</li>
              <li>设计基础：SMS4算法改进</li>
              <li>应用领域：无线局域网、金融</li>
            </ul>
          </div>
        </div>
        
        <!-- 安全提示 Security tips -->
        <div class="security-tips">
          <h3>🔐 安全建议</h3>
          <ul>
            <li><strong>密钥管理：</strong>使用强随机密钥，定期更换，安全存储</li>
            <li><strong>工作模式：</strong>生产环境推荐使用GCM模式（提供认证加密），或CBC/CTR模式。避免使用ECB模式。</li>
            <li><strong>初始化向量：</strong>每次加密使用不同的IV，且IV应随机生成。GCM模式IV不应重复使用。</li>
            <li><strong>填充方式：</strong>ECB和CBC模式默认使用PKCS#7填充。流密码模式（CTR/CFB/OFB/GCM）不需要填充。</li>
            <li><strong>认证加密：</strong>GCM模式提供加密和认证功能，可防止密文被篡改，适合对安全性要求高的场景。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 视图容器 View container */
.sm4-view {
  max-width: 1000px;
  margin: 0 auto;
}

/* 页面标题样式 Page header styles */
.page-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 35px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.page-header h1 {
  font-size: 2.2em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 15px;
  font-weight: 700;
}

.page-description {
  color: #555;
  line-height: 1.8;
  font-size: 1.05em;
}

/* 消息提示样式 Message notification styles */
.message {
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 消息进入/离开动画 Message enter/leave animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 区块样式 Section styles */
.section {
  background: white;
  padding: 35px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.section:hover {
  box-shadow: 0 8px 28px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.2);
}

.section-title {
  font-size: 1.6em;
  color: #333;
  margin-bottom: 25px;
  padding-bottom: 18px;
  border-bottom: 3px solid transparent;
  border-image: linear-gradient(90deg, #667eea, #764ba2) 1;
  font-weight: 600;
}

.section-content {
  padding-top: 10px;
}

/* 表单组样式 Form group styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95em;
}

/* 输入框样式 Input styles */
.input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
  background: #fafafa;
  color: #333;
}

.input:hover {
  border-color: #d0d0d0;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

/* 带按钮的输入框 Input with button */
.input-with-button {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-with-button .input {
  flex: 1;
}

/* 文本域样式 Textarea styles */
.textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  transition: all 0.3s ease;
  background: #fafafa;
  color: #333;
  line-height: 1.6;
}

.textarea:hover {
  border-color: #d0d0d0;
}

.textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

/* 单选按钮组样式 Radio group styles */
.radio-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 2px solid #e8e8e8;
  background: white;
}

.radio-label:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

/* Selected radio button style - using adjacent sibling for better compatibility */
.radio-input:checked + .radio-text {
  font-weight: 600;
}

.radio-label:has(.radio-input:checked) {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-color: #667eea;
  font-weight: 600;
}

/* Fallback for browsers without :has() support */
@supports not selector(:has(*)) {
  .radio-label {
    position: relative;
  }
  
  .radio-input:checked ~ * {
    font-weight: 600;
  }
}

.radio-input {
  margin-right: 8px;
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.radio-text {
  color: #333;
  font-size: 0.95em;
}

/* 提示文本样式 Hint text styles */
.hint {
  margin-top: 8px;
  font-size: 0.88em;
  color: #666;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #ffd93d;
}

/* 按钮样式 Button styles */
.btn {
  padding: 14px 32px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(-1px);
}

/* 主按钮 Primary button */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
}

/* 次按钮 Secondary button */
.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #333;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%);
}

/* 小按钮 Small button */
.btn-small {
  padding: 8px 16px;
  font-size: 13px;
  white-space: nowrap;
  background: #667eea;
  color: white;
}

/* 按钮组样式 Button group styles */
.button-group {
  display: flex;
  gap: 15px;
  margin: 20px 0;
  flex-wrap: wrap;
}

/* 信息区块样式 Info section styles */
.info-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.info-item {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-item h3 {
  color: #667eea;
  font-size: 1.1em;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.info-item ul {
  list-style: none;
  padding: 0;
}

.info-item li {
  padding: 8px 0;
  color: #555;
  line-height: 1.6;
  position: relative;
  padding-left: 20px;
}

.info-item li::before {
  content: '•';
  position: absolute;
  left: 5px;
  color: #667eea;
  font-weight: bold;
}

/* 安全提示样式 Security tips styles */
.security-tips {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #ffc107;
}

.security-tips h3 {
  color: #ff9800;
  font-size: 1.1em;
  margin-bottom: 15px;
}

.security-tips ul {
  list-style: none;
  padding: 0;
}

.security-tips li {
  padding: 10px 0;
  color: #555;
  line-height: 1.7;
  position: relative;
  padding-left: 25px;
}

.security-tips li::before {
  content: '⚠️';
  position: absolute;
  left: 0;
  font-size: 1.1em;
}

.security-tips strong {
  color: #333;
}

/* 响应式设计 Responsive design */
@media (max-width: 768px) {
  .page-header {
    padding: 20px;
  }

  .page-header h1 {
    font-size: 1.6em;
  }

  .section {
    padding: 20px;
  }

  .section-title {
    font-size: 1.3em;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .input-with-button {
    flex-direction: column;
  }

  .input-with-button .btn-small {
    width: 100%;
  }

  .radio-group {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
