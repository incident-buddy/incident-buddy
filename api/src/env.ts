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
