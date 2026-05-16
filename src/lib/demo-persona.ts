/** 演示用：多客户 / 门户视角（非真实鉴权） */

export const DEMO_PERSONA_STORAGE_KEY = 'pointx-demo-persona'

export type DemoPersonaId = 'admin' | 'client_sg' | 'client_eu'

export interface DemoPersonaOption {
  id: DemoPersonaId
  label: string
  shortLabel: string
  homePath: string
}

export const DEMO_PERSONA_OPTIONS: readonly DemoPersonaOption[] = [
  {
    id: 'admin',
    label: '管理员（平台运营）',
    shortLabel: '管理员',
    homePath: '/admin/home',
  },
  {
    id: 'client_sg',
    label: '企业用户 · 新加坡智联科技有限公司',
    shortLabel: '新加坡智联',
    homePath: '/client/dashboard',
  },
  {
    id: 'client_eu',
    label: '企业用户 · 欧洲智联科技有限公司',
    shortLabel: '欧洲智联',
    homePath: '/client/dashboard',
  },
] as const

export function isDemoPersonaId(v: string | null): v is DemoPersonaId {
  return v === 'admin' || v === 'client_sg' || v === 'client_eu'
}

export function readStoredDemoPersona(): DemoPersonaId {
  try {
    const raw = sessionStorage.getItem(DEMO_PERSONA_STORAGE_KEY)
    if (isDemoPersonaId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'admin'
}

export function writeStoredDemoPersona(id: DemoPersonaId): void {
  try {
    sessionStorage.setItem(DEMO_PERSONA_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function personaFromPathname(pathname: string): DemoPersonaId | null {
  if (pathname.startsWith('/admin')) return 'admin'
  return null
}

export function optionById(id: DemoPersonaId): DemoPersonaOption {
  const o = DEMO_PERSONA_OPTIONS.find((x) => x.id === id)
  return o ?? DEMO_PERSONA_OPTIONS[0]!
}
