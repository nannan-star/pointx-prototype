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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">资源信息</h1>
        <p className="mt-1 text-sm text-[#969696]">
          企业资源池配置与各服务节点用量概览
        </p>
      </div>

      {/* ── Company Identity Banner ── */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="h-1 bg-gradient-to-r from-[#ff7f32] via-[#ff9a5c] to-[#ff7f32]" />
        <div className="flex items-center gap-5 px-7 py-5">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7f32] to-[#e06820] shadow-md shadow-[#ff7f32]/20">
            <Building2 className="size-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#1a1a1a]">{profile.companyName}</h2>
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
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Database className="size-4 text-[#ff7f32]" />
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
          <div className="border-t border-[#e9ebec] px-6 py-5">
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
                          <FieldIcon className="size-3" />
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
                          <FieldIcon className="size-3" />
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
            <p className="mt-4 text-[11px] text-[#969696]">
              敏感字段在生产环境需脱敏展示与审计
            </p>
          </div>
        )}
      </div>

      {/* ── Global Summary Card ── */}
      {globalNode && (
        <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#ff7f32]" />
          <div className="flex items-center gap-6 px-7 py-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#ff7f32]/10">
              <Globe className="size-5 text-[#ff7f32]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{globalNode.serviceNode}</h3>
                <span className="inline-flex rounded-full bg-[#ff7f32]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff7f32]">
                  汇总
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#969696]">{globalNode.product}</p>
            </div>
            <div className="flex items-baseline gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1a1a1a]">{globalNode.used.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-[#969696]">已用</p>
              </div>
              <div className="text-[#d0d3d5]">/</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#323232]">{globalNode.total.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-[#969696]">总量</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#22c55e]">{globalNode.unused.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-[#969696]">剩余</p>
              </div>
              <div className="ml-2 flex flex-col items-end">
                <span className="text-lg font-bold text-[#ff7f32]">{globalPct}%</span>
                <span className="text-[10px] text-[#969696]">使用率</span>
              </div>
            </div>
          </div>
          <div className="h-1 bg-[#f0f0f0]">
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
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Server className="size-4 text-[#ff7f32]" />
            </div>
            <h2 className="text-sm font-semibold text-[#1a1a1a]">按节点 · 资源用量</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
