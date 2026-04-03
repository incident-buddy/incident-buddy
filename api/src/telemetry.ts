import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

const isTestEnv = Boolean(process.env.VITEST);

let sdk: NodeSDK | undefined;

if (!isTestEnv) {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
      exportIntervalMillis: 60_000,
    }),
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk?.shutdown().catch(console.error);
  });
}

/**
 * 関数をトレーシングスパンでラップする計装ヘルパー
 *
 * @description `features/` のコードが `@opentelemetry/api` に直接依存しないよう、
 * スパン生成を隠蔽したラッパー関数。テスト環境（`process.env.VITEST`）では
 * SDK は初期化されないため、関数をそのまま実行して返す。
 *
 * @param name - スパン名（例: `"incident.repository.create"`）
 * @param attrs - スパンに付与する属性（例: `{ collection: "incidents", operation: "create" }`）
 * @param fn - 計装対象の非同期関数
 * @returns fn の戻り値をそのまま返す
 */
export async function withSpan<T>(
  name: string,
  attrs: Record<string, string>,
  fn: () => Promise<T>,
): Promise<T> {
  if (isTestEnv) {
    return fn();
  }

  const { trace } = await import("@opentelemetry/api");
  const tracer = trace.getTracer("incident-buddy");

  return tracer.startActiveSpan(name, async (span) => {
    for (const [key, value] of Object.entries(attrs)) {
      span.setAttribute(key, value);
    }
    try {
      const result = await fn();
      span.setStatus({ code: 1 }); // SpanStatusCode.OK = 1
      return result;
    } catch (err) {
      if (err instanceof Error) {
        span.recordException(err);
      }
      span.setStatus({ code: 2 }); // SpanStatusCode.ERROR = 2
      throw err;
    } finally {
      span.end();
    }
  });
}
