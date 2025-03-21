export function Highlight(props: { text: string }) {
  return (
    <code
      className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{props.text}</code>
  )
}