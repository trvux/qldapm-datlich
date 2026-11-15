"use client"

import { useCallback, useEffect, useEffectEvent, useState } from "react"

type Result<T> = { key: string; data: T | null; error: unknown }

/**
 * Gọi API khi mount hoặc khi `deps` đổi; `reload` tải lại mà không nháy skeleton (giữ dữ liệu cũ tới khi có dữ liệu mới).
 * `loading` chỉ true khi chưa có kết quả cho bộ `deps` hiện tại.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]) {
  const key = JSON.stringify(deps)
  const [tick, setTick] = useState(0)
  const [res, setRes] = useState<Result<T> | null>(null)
  const run = useEffectEvent(fn)

  useEffect(() => {
    let stale = false
    run()
      .then((data) => { if (!stale) setRes({ key, data, error: null }) })
      .catch((error) => { if (!stale) setRes({ key, data: null, error }) })
    return () => { stale = true }
  }, [key, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data: res?.data ?? null, error: res?.error ?? null, loading: res?.key !== key, reload }
}
