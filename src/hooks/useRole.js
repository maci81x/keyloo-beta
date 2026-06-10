import { useState, useCallback } from 'react'

const STORAGE_KEY = 'keyloo_role'

export function useRole() {
  const [role, setRoleState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'inquilino'
  )

  const setRole = useCallback((r) => {
    localStorage.setItem(STORAGE_KEY, r)
    setRoleState(r)
  }, [])

  const toggleRole = useCallback(() => {
    setRole(role === 'inquilino' ? 'proprietario' : 'inquilino')
  }, [role, setRole])

  return { role, setRole, toggleRole }
}
