export interface Sm9RuntimeRequest {
  operation: 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'generateMasterKey';
  payload: unknown;
}

export interface Sm9Runtime {
  readonly kind: 'java-api' | 'wasm';
  execute(request: Sm9RuntimeRequest): Promise<unknown>;
}

export class JavaApiSm9Runtime implements Sm9Runtime {
  readonly kind = 'java-api' as const;

  constructor(private readonly endpoint: string) {}

  async execute(request: Sm9RuntimeRequest): Promise<unknown> {
    if (!this.endpoint.trim()) {
      throw new Error('请先配置 Java API endpoint');
    }

    const response = await fetch(`${this.endpoint.replace(/\/$/, '')}/${request.operation}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.payload),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`SM9 Java API 返回 ${response.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}

export class WasmSm9Runtime implements Sm9Runtime {
  readonly kind = 'wasm' as const;

  constructor(private readonly wasmUrl: string) {}

  async execute(_request: Sm9RuntimeRequest): Promise<unknown> {
    if (!this.wasmUrl.trim()) {
      throw new Error('请先配置 WASM URL');
    }
    throw new Error('SM9 WASM runtime 仅预留接口，尚未接入 wasm module。');
  }
}
