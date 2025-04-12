export function Hr(props: { text: string }) {
  return (
    <div className="inline-flex items-center justify-center w-full">
      <hr className="w-1/4 h-px bg-slate-200 border-0" />
      <span className="text-sm text-slate-600 px-3">{props.text}</span>
      <hr className="w-1/4  h-px bg-slate-200 border-0" />
    </div>
  );
}
