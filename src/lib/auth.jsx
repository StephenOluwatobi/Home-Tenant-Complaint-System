import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { clearLegacyCredentials } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const queue = useRef(Promise.resolve())

  function runInOrder(operation) {
    const result = queue.current.then(operation)
    queue.current = result.catch(() => {})
    return result
  }

  useEffect(() => {
    clearLegacyCredentials()
    let current = true
    const restore = () => {
      runInOrder(async () => {
        if (!current) return
        try {
          const response = await fetch('/api/auth', { cache: 'no-store' })
          const access = response.ok ? await response.json() : null
          if (current) setSession(access)
        } catch {
          if (current) setSession(null)
        } finally {
          if (current) setCheckingSession(false)
        }
      })
    }
    restore()
    window.addEventListener('focus', restore)
    return () => {
      current = false
      window.removeEventListener('focus', restore)
    }
  }, [])

  function signIn(role, password, unit) {
    return runInOrder(async () => {
      let response
      try {
        response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, unit, password }),
        })
      } catch {
        throw new Error('Unable to sign in. Please try again.')
      }
      if (response.status === 401) {
        throw new Error(role === 'tenant'
          ? `Incorrect password for Unit ${unit}.`
          : 'Incorrect management password.')
      }
      if (!response.ok) throw new Error('Unable to sign in. Please try again.')
      setSession(await response.json())
    })
  }

  const value = {
    session,
    checkingSession,
    signInUnit(unit, password) { return signIn('tenant', password, unit) },
    signInManagement(password) { return signIn('management', password) },
    signOut() {
      setSession(null)
      return runInOrder(async () => {
        try {
          await fetch('/api/auth', { method: 'DELETE' })
        } finally {
          setSession(null)
        }
      }).catch(() => {})
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
