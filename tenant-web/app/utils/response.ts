export function notFound(resourceName?: string) {
  return new Response(resourceName, { status: 404});
}
