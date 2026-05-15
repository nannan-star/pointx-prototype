import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Globe2,
  MapPin,
  Package,
  Server,
  Settings,
  ShoppingCart,
  User,
} from 'lucide-react'
import { DemoPersonaSwitcher } from '@/components/DemoPersonaSwitcher'
import { cn } from '@/lib/utils'

type NavChild = { label: string; path: string }

type NavEntry =
  | { kind: 'link'; label: string; path: string; icon: typeof User }
  | { kind: 'group'; label: string; icon: typeof Server; children: NavChild[] }

const navEntries: NavEntry[] = [
  {
    kind: 'group',
    label: '资源中心',
    icon: Server,
    children: [
      { label: '实例', path: '/admin/instances' },
      { label: '资源池', path: '/admin/pool' },
      { label: 'SDK 资源', path: '/admin/resources/sdk' },
      { label: 'CORS 账号', path: '/admin/resources/cors' },
    ],
  },
  {
    kind: 'group',
    label: '交易中心',
    icon: ShoppingCart,
    children: [{ label: '订单列表', path: '/admin/trade/orders' }],
  },
  {
    kind: 'group',
    label: '配置中心',
    icon: Package,
    children: [
      { label: '服务节点', path: '/admin/config/nodes' },
      { label: '服务套餐', path: '/admin/config/packages' },
      { label: '商品', path: '/admin/products' },
      { label: '商品规格', path: '/admin/specs' },
    ],
  },
  {
    kind: 'group',
    label: '系统管理',
    icon: Settings,
    children: [
      { label: '企业用户', path: '/admin/enterprises' },
      { label: '管理用户', path: '/admin/system/admins' },
      { label: '角色权限', path: '/admin/system/roles' },
      { label: '菜单管理', path: '/admin/system/menus' },
      { label: '字典管理', path: '/admin/system/dict' },
    ],
  },
  { kind: 'link', label: '模块说明', path: '/admin/module-docs', icon: BookOpen },
  { kind: 'link', label: '个人中心', path: '/admin/profile', icon: User },
]

function isPathUnder(prefix: string, pathname: string): boolean {
  if (pathname === prefix) return true
  return pathname.startsWith(`${prefix}/`)
}

function groupHasActiveChild(children: NavChild[], pathname: string): boolean {
  return children.some((c) => isPathUnder(c.path, pathname))
}

export default function AdminLayout() {
  const { pathname } = useLocation()

  const defaultOpen = useMemo(() => {
    const set = new Set<string>()
    for (const e of navEntries) {
      if (e.kind === 'group' && groupHasActiveChild(e.children, pathname)) {
        set.add(e.label)
      }
    }
    return set
  }, [pathname])

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => defaultOpen)

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      for (const e of navEntries) {
        if (e.kind === 'group' && groupHasActiveChild(e.children, pathname)) {
          next.add(e.label)
        }
      }
      return next
    })
  }, [pathname])

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div className="flex h-screen flex-col bg-[#f9f9f9] text-[#323232]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e9ebec] bg-[#f9f9f9] px-3 shadow-[0px_0px_12px_-1px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 pl-1">
          <MapPin className="size-6 shrink-0 text-[#ff7f32]" aria-hidden />
          <span className="font-sans text-[18px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
            POINTX
          </span>
        </div>
        <div className="flex items-center gap-2 pr-1">
          <DemoPersonaSwitcher />
          <button
            type="button"
            className="relative flex size-9 cursor-pointer items-center justify-center rounded-md text-[#323232] transition-colors hover:bg-white/80"
            aria-label="通知"
          >
            <Bell className="size-[22px]" strokeWidth={1.75} />
            <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white bg-[#eb2e2e] px-1 text-[10px] font-medium leading-none text-white">
              22
            </span>
          </button>
          <button
            type="button"
            className="flex size-9 cursor-pointer items-center justify-center rounded-md text-[#323232] transition-colors hover:bg-white/80"
            aria-label="语言"
          >
            <Globe2 className="size-[22px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="flex size-9 cursor-pointer items-center justify-center rounded-md text-[#323232] transition-colors hover:bg-white/80"
            aria-label="账户"
          >
            <User className="size-[22px]" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-[#e9ebec] bg-[#f9f9f9]">
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
            {navEntries.map((entry) => {
              if (entry.kind === 'link') {
                const Icon = entry.icon
                return (
                  <NavLink
                    key={entry.path}
                    to={entry.path}
                    end
                    className={({ isActive }) =>
                      cn(
                        'relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-[#323232]',
                        isActive
                          ? 'bg-white font-medium text-[#323232] shadow-[inset_3px_0_0_0_#ff7f32,0_1px_2px_rgba(0,0,0,0.04)]'
                          : 'hover:bg-white/60'
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0 text-[#646464]" strokeWidth={1.75} />
                    {entry.label}
                  </NavLink>
                )
              }

              const expanded = openGroups.has(entry.label)
              const GroupIcon = entry.icon
              const childActive = groupHasActiveChild(entry.children, pathname)

              return (
                <div key={entry.label} className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.label)}
                    aria-expanded={expanded}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      childActive && !expanded
                        ? 'font-medium text-[#323232]'
                        : 'text-[#323232] hover:bg-white/60'
                    )}
                  >
                    <GroupIcon className="size-4 shrink-0 text-[#646464]" strokeWidth={1.75} />
                    <span className="flex-1">{entry.label}</span>
                    {expanded ? (
                      <ChevronDown className="size-4 shrink-0 text-[#969696]" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-[#969696]" />
                    )}
                  </button>
                  {expanded && (
                    <div className="mt-0.5 space-y-0.5 pl-2">
                      {entry.children.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={() =>
                            cn(
                              'relative block cursor-pointer rounded-md py-2 pl-8 pr-3 text-sm transition-colors',
                              isPathUnder(item.path, pathname)
                                ? 'bg-white font-medium text-[#323232] shadow-[inset_3px_0_0_0_#ff7f32,0_1px_2px_rgba(0,0,0,0.04)]'
                                : 'text-[#646464] hover:bg-white/60 hover:text-[#323232]'
                            )
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f9f9f9] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
