import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Smartphone,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Globe,
  Clock,
  ChevronRight,
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const stats = {
  kpis: [
    { label: '新增设备', sub: '近 7 日', value: '128', icon: Smartphone, trend: '+12.4%', up: true },
    { label: '新增帐号', sub: '近 7 日', value: '56', icon: Users, trend: '+6.8%', up: true },
    { label: '日活帐号', sub: '昨日', value: '3,842', icon: Activity, trend: '+3.2%', up: true },
  ],
  resourceCards: [
    { name: '千寻定位增强包', used: 820, total: 1000 },
    { name: '高精度地图账号包', used: 188, total: 200 },
    { name: '星基订阅套餐', used: 68, total: 100 },
    { name: 'CORS 企业账号包', used: 41, total: 60 },
  ],
  regionUsage: [
    { region: '新加坡', spec: '千寻定位增强包', active: 382, total: 500, updatedAt: '2026-04-27 18:20' },
    { region: '欧洲', spec: '高精度地图账号包', active: 119, total: 150, updatedAt: '2026-04-27 18:16' },
    { region: '北美', spec: '星基订阅套餐', active: 64, total: 80, updatedAt: '2026-04-27 18:11' },
    { region: '中东', spec: 'CORS 企业账号包', active: 28, total: 40, updatedAt: '2026-04-27 17:59' },
  ],
  trend: {
    week: [230, 260, 310, 280, 360, 390, 420],
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
}

function getUsageColor(pct: number) {
  if (pct >= 90) return { bar: 'bg-[#eb2e2e]', track: 'bg-[#eb2e2e]/10', text: 'text-[#eb2e2e]' }
  if (pct >= 70) return { bar: 'bg-[#ff7f32]', track: 'bg-[#ff7f32]/10', text: 'text-[#ff7f32]' }
  return { bar: 'bg-[#22c55e]', track: 'bg-[#22c55e]/10', text: 'text-[#22c55e]' }
}

export default function DashboardPage() {
  const [granularity, setGranularity] = useState('week')
  const max = Math.max(...stats.trend.week, 1)

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">资源看板</h1>
        </div>
        <Link to="/client/trade/reconciliation">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#e9ebec] text-[#646464] hover:border-[#ff7f32]/30 hover:bg-[#ff7f32]/5 hover:text-[#ff7f32]"
          >
            去对账管理
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-5">
        {stats.kpis.map((kpi) => {
          const KpiIcon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#ff7f32]/10">
                  <KpiIcon className="size-5 text-[#ff7f32]" />
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#22c55e]">
                  {kpi.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {kpi.trend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight text-[#1a1a1a]">{kpi.value}</p>
                <p className="mt-1 text-xs text-[#969696]">
                  {kpi.label}
                  <span className="mx-1 text-[#d0d3d5]">·</span>
                  {kpi.sub}
                </p>
              </div>
              {/* subtle corner accent */}
              <div className="pointer-events-none absolute -bottom-6 -right-6 size-24 rounded-full bg-[#ff7f32]/[0.03] transition-transform group-hover:scale-125" />
            </div>
          )
        })}
      </div>

      {/* ── Resource Quota Cards ── */}
      <div className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
            <BarChart3 className="size-4 text-[#ff7f32]" />
          </div>
          <h2 className="text-sm font-semibold text-[#1a1a1a]">按规格 · 账号余量</h2>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {stats.resourceCards.map((c) => {
            const pct = Math.round((100 * c.used) / c.total)
            const color = getUsageColor(pct)
            return (
              <div key={c.name} className="rounded-xl border border-[#e9ebec] p-5">
                <p className="text-sm font-medium text-[#323232]">{c.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1a1a1a]">{c.used}</span>
                  <span className="text-sm text-[#969696]">/ {c.total}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[#969696]">余量 {c.total - c.used}</span>
                  <span className={`font-medium ${color.text}`}>{pct}%</span>
                </div>
                <div className={`mt-3 h-2 rounded-full ${color.track} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom Grid: Trend + Region Table ── */}
      <div className="grid grid-cols-[1fr_1fr] gap-5">
        {/* Trend Chart */}
        <div className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
                <Activity className="size-4 text-[#ff7f32]" />
              </div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">用户活跃趋势</h2>
            </div>
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="h-8 w-[72px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">周</SelectItem>
                <SelectItem value="day">日</SelectItem>
                <SelectItem value="month">月</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex h-48 items-end gap-3">
            {stats.trend.week.map((v, i) => {
              const height = Math.round((v / max) * 100)
              return (
                <div key={i} className="group flex flex-1 flex-col items-center">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#ff7f32] to-[#ff9a5c] opacity-80 transition-all group-hover:opacity-100"
                      style={{ height: `${height * 1.6}px` }}
                    />
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-[#646464] opacity-0 transition-opacity group-hover:opacity-100">
                      {v}
                    </span>
                  </div>
                  <span className="mt-2 text-[11px] text-[#969696]">{stats.trend.labels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Region Table */}
        <div className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Globe className="size-4 text-[#ff7f32]" />
            </div>
            <h2 className="text-sm font-semibold text-[#1a1a1a]">按区域激活</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b-[#e9ebec] hover:bg-transparent">
                <TableHead className="text-xs font-medium text-[#969696]">区域</TableHead>
                <TableHead className="text-xs font-medium text-[#969696]">规格</TableHead>
                <TableHead className="text-right text-xs font-medium text-[#969696]">激活数</TableHead>
                <TableHead className="text-xs font-medium text-[#969696]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    更新时间
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.regionUsage.map((r) => {
                const regionPct = Math.round((100 * r.active) / r.total)
                const regionColor = getUsageColor(regionPct)
                return (
                  <TableRow key={r.region} className="border-b-[#f0f0f0]">
                    <TableCell className="py-3 font-medium text-[#323232]">{r.region}</TableCell>
                    <TableCell className="py-3 text-sm text-[#646464]">{r.spec}</TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#f0f0f0]">
                          <div
                            className={`h-full rounded-full ${regionColor.bar}`}
                            style={{ width: `${regionPct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[#323232]">{r.active}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-[#969696]">{r.updatedAt}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
