import { context, type Span, trace, type Tracer } from "opentelemetry";
import { createMiddleware } from "hono/factory";

type WithSpan = <T>(
  name: string,
  block: (span: Span) => T | Promise<T>,
) => T | Promise<T>;
type WithSpanFactory = (tracer: Tracer) => WithSpan;
export type Tracing = {
  tracer: Tracer;
  withSpan: WithSpan;
};

export const trasing = createMiddleware(async (c, next) => {
  const tracer = trace.getTracer("incident-buddy-api");
  c.set("trasing", {
    tracer,
    withSpan: withSpanFactory(tracer),
  });
  return await next();
});

const withSpanFactory: WithSpanFactory = (tracer) => (name, block) => {
  const span = tracer.startSpan(name);
  const contextWithSpan = trace.setSpan(context.active(), span);
  return context.with(contextWithSpan, async () => {
    const res = await block(span);
    span.end();
    return res;
  });
};
