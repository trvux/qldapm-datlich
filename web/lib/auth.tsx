"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { api, tokenStore, type Role, type User } from "@/lib/api"

type AuthState = {
  user: User | null
  /** true cho tới khi kiểm xong token đã lưu */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const request = tokenStore.get() ? api.me() : Promise.resolve(null)
    request
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const t = await api.login(email, password)
    tokenStore.set(t.access_token)
    setUser(t.user)
    return t.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth phải nằm trong AuthProvider")
  return ctx
}

export const isStaffRole = (r?: Role) => r === "STAFF" || r === "MANAGER"
