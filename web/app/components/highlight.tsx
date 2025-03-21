export function Highlight(props: { text: string }) {
  return (
    <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">{props.text}</code>
  )
}