import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  type DemoPersonaId,
  optionById,
  personaFromPathname,
  readStoredDemoPersona,
  writeStoredDemoPersona,
} from '@/lib/demo-persona'

type DemoPersonaContextValue = {
  personaId: DemoPersonaId
  setPersonaId: (id: DemoPersonaId) => void
}

const DemoPersonaContext = createContext<DemoPersonaContextValue | null>(null)

function readInitialPersona(): DemoPersonaId {
  if (typeof window === 'undefined') return 'admin'
  const p = window.location.pathname
  if (p.startsWith('/client')) {
    const s = readStoredDemoPersona()
    if (s === 'client_sg' || s === 'client_eu') return s
    return 'client_sg'
  }
  if (p.startsWith('/admin')) return 'admin'
  return readStoredDemoPersona()
}

export function DemoPersonaProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [personaId, setPersonaIdState] = useState<DemoPersonaId>(readInitialPersona)

  /** 进入 /admin 时与管理员视角对齐；进入 /client 时保留或回落到已选租户 */
  useEffect(() => {
    const fromPath = personaFromPathname(pathname)
    if (fromPath === 'admin') {
      setPersonaIdState('admin')
      writeStoredDemoPersona('admin')
      return
    }
    if (pathname.startsWith('/client')) {
      const stored = readStoredDemoPersona()
      if (stored === 'client_sg' || stored === 'client_eu') {
        setPersonaIdState(stored)
        return
      }
      setPersonaIdState('client_sg')
      writeStoredDemoPersona('client_sg')
    }
  }, [pathname])

  const setPersonaId = useCallback(
    (id: DemoPersonaId) => {
      writeStoredDemoPersona(id)
      setPersonaIdState(id)
      const home = optionById(id).homePath
      const targetClient = id === 'client_sg' || id === 'client_eu'
      const onClient = pathname.startsWith('/client')
      if (targetClient && onClient) {
        return
      }
      navigate(home)
    },
    [navigate, pathname]
  )

  const value = useMemo(() => ({ personaId, setPersonaId }), [personaId, setPersonaId])

  return <DemoPersonaContext.Provider value={value}>{children}</DemoPersonaContext.Provider>
}

export function useDemoPersona(): DemoPersonaContextValue {
  const ctx = useContext(DemoPersonaContext)
  if (!ctx) {
    throw new Error('useDemoPersona must be used within DemoPersonaProvider')
  }
  return ctx
}
