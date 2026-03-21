/**
 * requireEnv - 環境変数が未設定の場合は起動時にクラッシュさせる
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * optionalEnv - 任意の環境変数を取得する。未設定の場合は undefined を返す
 */
export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}
