import { errorText } from "@/lib/api"

export function ErrorNote({ error, who = "khach" }: { error: unknown; who?: "khach" | "staff" }) {
  if (!error) return null
  return <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{errorText(error, who)}</p>
}
