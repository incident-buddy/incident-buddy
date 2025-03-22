export function Hr(props: { text: string}) {
  return (
    <div className="inline-flex items-center justify-start w-full relative">
      <hr className="w-2/5 h-px bg-gray-200 border-0 dark:bg-gray-700"/>
      <span
        className="text-sm text-slate-600 absolute left-6 px-3 bg-white">
        {props.text}
      </span>
    </div>
  )
}