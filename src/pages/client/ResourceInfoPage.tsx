import { useState } from 'react'
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Key,
  Database,
  Globe,
  ShieldCheck,
  FileText,
  Server,
} from 'lucide-react'
import { clientCompanyProfile, clientEnterpriseResources } from '@/data/resource-mock'

export default function ResourceInfoPage() {
  const [poolExpanded, setPoolExpanded] = useState(true)
  const profile = clientCompanyProfile
  const rows = clientEnterpriseResources

  const secretFields = [
    { label: 'AK', value: profile.ak, icon: Key },
    { label: 'AS', value: profile.as, icon: Key },
    { label: 'SI', value: profile.si, icon: Database },
    { label: 'SIK', value: profile.sik, icon: Key },
  ]

  const configFields = [
    { label: '入库方式', value: profile.entryMode, icon: FileText },
    { label: '激活方式', value: profile.activateMode, icon: ShieldCheck },
    { label: '计费方式', value: profile.billingMode, icon: FileText },
    { label: '对账方式', value: profile.reconcileMode, icon: FileText },
  ]

  const globalNode = rows.find((r) => r.isGlobal)
  const regionNodes = rows.filter((r) => !r.isGlobal)
  const globalPct = globalNode && globalNode.total > 0
    ? Math.round((globalNode.used / globalNode.total) * 100)
    : 0

  return (
    <div className="flex h-full flex-col gap-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">资源信息</h1>
      </div>

      {/* ── Company Identity Banner ── */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="h-1 bg-gradient-to-r from-[#ff7f32] via-[#ff8f4a] to-[#ff9a5c]" />
        <div className="flex items-center gap-5 p-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff7f32] via-[#ff8f4a] to-[#ff9a5c]">
            <Building2 className="size-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">{profile.companyName}</h2>
            <p className="mt-0.5 text-sm text-[#646464]">
              公司 ID：<span className="font-mono font-medium text-[#323232]">{profile.companyId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Resource Pool Config (collapsible) ── */}
      <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => setPoolExpanded(!poolExpanded)}
          className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-[#ff7f32]/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Database className="size-3.5 text-[#ff7f32]" />
            </div>
            <span className="text-sm font-semibold text-[#1a1a1a]">资源池信息</span>
          </div>
          {poolExpanded ? (
            <ChevronUp className="size-4 text-[#969696]" />
          ) : (
            <ChevronDown className="size-4 text-[#969696]" />
          )}
        </button>

        {poolExpanded && (
          <div className="border-t border-[#e9ebec] p-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {/* Secret / credential fields */}
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969696]">
                  凭证信息
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {secretFields.map((f) => {
                    const FieldIcon = f.icon
                    return (
                      <div key={f.label}>
                        <div className="flex items-center gap-1.5 text-xs text-[#969696]">
                          <FieldIcon className="size-3.5 shrink-0" />
                          {f.label}
                        </div>
                        <p className="mt-0.5 font-mono text-sm font-medium text-[#323232]">
                          {f.value}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Config fields */}
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969696]">
                  配置方式
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {configFields.map((f) => {
                    const FieldIcon = f.icon
                    return (
                      <div key={f.label}>
                        <div className="flex items-center gap-1.5 text-xs text-[#969696]">
                          <FieldIcon className="size-3.5 shrink-0" />
                          {f.label}
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-[#323232]">
                          {f.value}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Global Summary Card ── */}
      {globalNode && (
        <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#ff7f32]" />
          <div className="flex items-center gap-6 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Globe className="size-5 text-[#ff7f32]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{globalNode.serviceNode}</h3>
                <span className="inline-flex rounded-full bg-[#ff7f32]/10 px-2 py-0.5 text-[11px] font-semibold text-[#ff7f32]">
                  汇总
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#969696]">{globalNode.product}</p>
            </div>
            <div className="flex items-baseline gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-[#1a1a1a]">{globalNode.used.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-[#969696]">已用</p>
              </div>
              <div className="text-[#969696]">/</div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#323232]">{globalNode.total.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-[#969696]">总量</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#22c55e]">{globalNode.unused.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-[#969696]">剩余</p>
              </div>
              <div className="ml-2 flex flex-col items-end">
                <span className="text-xl font-bold text-[#ff7f32]">{globalPct}%</span>
                <span className="text-[11px] text-[#969696]">使用率</span>
              </div>
            </div>
          </div>
          <div className="h-1 bg-[#f9f9f9]">
            <div
              className="h-full bg-gradient-to-r from-[#ff7f32] to-[#ff9a5c] transition-all duration-500"
              style={{ width: `${globalPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Region Node Cards ── */}
      {regionNodes.length > 0 && (
        <div>
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Server className="size-3.5 text-[#ff7f32]" />
            </div>
            <h2 className="text-sm font-semibold text-[#1a1a1a]">按节点 · 资源用量</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {regionNodes.map((row) => (
              <ResourceNodeCard key={row.serviceNode} {...row} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getUsageColor(pct: number) {
  if (pct >= 90) return { bar: 'bg-[#eb2e2e]', track: 'bg-[#eb2e2e]/10', text: 'text-[#eb2e2e]' }
  if (pct >= 70) return { bar: 'bg-[#ff7f32]', track: 'bg-[#ff7f32]/10', text: 'text-[#ff7f32]' }
  return { bar: 'bg-[#22c55e]', track: 'bg-[#22c55e]/10', text: 'text-[#22c55e]' }
}

interface ResourceNodeCardProps {
  serviceNode: string
  product: string
  total: number
  used: number
  unused: number
  isGlobal: boolean
}

function ResourceNodeCard({ serviceNode, product, total, used, unused }: ResourceNodeCardProps) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  const color = getUsageColor(pct)

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <h4 className="text-sm font-semibold text-[#1a1a1a]">{serviceNode}</h4>
      <p className="mt-0.5 text-xs text-[#969696]">{product}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-xl font-bold text-[#1a1a1a]">{used.toLocaleString()}</span>
        <span className="text-sm text-[#969696]">/ {total.toLocaleString()}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-[#969696]">剩余 {unused.toLocaleString()}</span>
        <span className={`font-medium ${color.text}`}>{pct}%</span>
      </div>

      <div className={`mt-2.5 h-2 rounded-full ${color.track} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${color.bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
