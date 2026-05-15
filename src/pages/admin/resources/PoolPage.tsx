import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { resourcePools, type ResourcePoolLine } from '@/data/instance-mock'
import { cn } from '@/lib/utils'

interface CompanyGroup {
  id: string
  name: string
  lines: ResourcePoolLine[]
}

function groupByCompany(data: ResourcePoolLine[]): CompanyGroup[] {
  const map = new Map<string, CompanyGroup>()
  const order: string[] = []
  for (const l of data) {
    if (!map.has(l.company)) {
      order.push(l.company)
      map.set(l.company, { id: l.enterpriseId, name: l.company, lines: [] })
    }
    map.get(l.company)!.lines.push(l)
  }
  return order.map(n => map.get(n)!)
}

export default function PoolPage() {
  const [keyword, setKeyword] = useState('')
  const allCompanies = useMemo(() => groupByCompany(resourcePools), [])
  const [selectedName, setSelectedName] = useState(allCompanies[0]?.name ?? '')
  const [companyPage, setCompanyPage] = useState(1)
  const perPage = 7

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return allCompanies
    return allCompanies.filter(c =>
      c.name.toLowerCase().includes(kw) || c.id.toLowerCase().includes(kw),
    )
  }, [allCompanies, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(companyPage, totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const selected = allCompanies.find(c => c.name === selectedName) ?? null

  const handleFilter = () => {
    setCompanyPage(1)
    const firstFiltered = filtered[0]
    if (!filtered.find(c => c.name === selectedName) && firstFiltered) {
      setSelectedName(firstFiltered.name)
    }
  }

  const handleReset = () => {
    setKeyword('')
    setCompanyPage(1)
    const firstCompany = allCompanies[0]
    if (firstCompany) setSelectedName(firstCompany.name)
  }

  return (
    <div className="-m-6 flex h-full flex-col bg-[#f9f9f9]">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-3">
        <div className="flex">
          <span className="flex h-8 items-center rounded-l-lg border border-r-0 border-[#ececec] bg-white px-2 text-sm text-[#303030] whitespace-nowrap">
            公司名称
          </span>
          <Input
            className="h-8 w-[260px] rounded-l-none border-[#ececec] text-sm placeholder:text-[#c5c5c5] focus-visible:ring-0 focus-visible:border-[#ececec]"
            placeholder="请输入账号名"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
          />
        </div>
        <button
          className="h-8 min-w-[64px] cursor-pointer rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-white hover:bg-[#ff7f32]/90"
          onClick={handleFilter}
        >
          筛选
        </button>
        <button
          className="h-8 min-w-[64px] cursor-pointer rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#e9ebec]/80"
          onClick={handleReset}
        >
          重置
        </button>
      </div>

      {/* Master-detail */}
      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        {/* Left: company list */}
        <div className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#e9ebec] bg-white">
          <div className="flex shrink-0 items-center justify-between bg-[#f5f7f9] px-4 py-3">
            <span className="text-[13px] font-semibold text-[#666]">企业名称</span>
            <span className="text-xs text-[#969696]">共 {filtered.length} 家</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {paged.map(c => {
              const active = selected?.name === c.name
              const configured = c.lines.filter(l => l.total > 0).length
              const total = c.lines.length
              const allDone = configured === total

              return (
                <div
                  key={c.id + c.name}
                  className={cn(
                    'flex cursor-pointer flex-col gap-2 px-4 py-[14px] transition-colors',
                    active
                      ? 'border border-[#ff7f32] bg-[#fff4ec]'
                      : 'border-b border-[#e9ebec] bg-white hover:bg-[#fafafa]',
                  )}
                  onClick={() => setSelectedName(c.name)}
                >
                  <div className="flex items-center justify-between">
                    <span className="mr-2 truncate text-sm font-semibold text-[#323232]">{c.name}</span>
                    <span className="flex shrink-0 items-center gap-1 rounded-[3px] border border-[#b7e4c1] bg-[#e8f6ec] px-1.5 py-0.5">
                      <span className="size-[5px] rounded-full bg-[#117a35]" />
                      <span className="whitespace-nowrap text-[11px] font-medium text-[#117a35]">
                        {allDone ? '已配置' : `${configured}/${total} 已配置`}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-[10px] text-xs text-[#969696]">
                    <span>{c.id}</span>
                    <span>·</span>
                    <span>{total} 个商品</span>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex shrink-0 items-center justify-center gap-2 border-t border-[#e9ebec] py-2">
              <button
                className="cursor-pointer rounded p-1 hover:bg-[#f5f7f9] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safePage <= 1}
                onClick={() => setCompanyPage(p => p - 1)}
              >
                <ChevronLeft className="size-4 text-[#323232]" />
              </button>
              <span className="min-w-[32px] text-center text-sm text-[#323232]">{safePage}/{totalPages}</span>
              <button
                className="cursor-pointer rounded p-1 hover:bg-[#f5f7f9] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safePage >= totalPages}
                onClick={() => setCompanyPage(p => p + 1)}
              >
                <ChevronRight className="size-4 text-[#323232]" />
              </button>
            </div>
          )}
        </div>

        {/* Right: detail */}
        {selected ? <RightPanel company={selected} /> : (
          <div className="flex flex-1 items-center justify-center text-[#969696]">
            请在左侧选择一个企业
          </div>
        )}
      </div>
    </div>
  )
}

function RightPanel({ company }: { company: CompanyGroup }) {
  const totalQty = company.lines.reduce((s, l) => s + l.total, 0)
  const usedQty = company.lines.reduce((s, l) => s + l.used, 0)
  const pct = totalQty > 0 ? Math.round((usedQty / totalQty) * 100) : 0

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      {/* Header card */}
      <div className="flex shrink-0 items-center justify-between rounded-lg border border-[#e9ebec] bg-white px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-[#323232]">{company.name}</span>
          <div className="flex items-center gap-[10px] text-xs text-[#969696]">
            <span>{company.id}</span>
            <span>· {company.lines.length} 个商品</span>
            <span>· 已用 {usedQty} / {totalQty} ({pct}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-7 cursor-pointer rounded-md border border-[#e9ebec] bg-white px-3 text-xs text-[#666] hover:bg-[#f9f9f9]">
            导出
          </button>
          <button className="h-7 cursor-pointer rounded-md border border-[#ffa05c] bg-[#ff7f32] px-3 text-xs font-medium text-white hover:bg-[#ff7f32]/90">
            批量续费
          </button>
        </div>
      </div>

      {/* Product table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e9ebec] bg-white">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#f5f7f9]">
                <th className="h-10 max-w-[200px] px-3 text-left text-[13px] font-semibold text-[#666]">商品名称</th>
                <th className="h-10 w-[140px] px-3 text-left text-[13px] font-semibold text-[#666]">商品规格</th>
                <th className="h-10 w-[92px] px-3 text-left text-[12px] font-semibold text-[#666]">是否默认规格</th>
                <th className="h-10 w-[113px] px-3 text-right text-[12px] font-semibold text-[#666]">总数量</th>
                <th className="h-10 w-[113px] px-3 text-right text-[12px] font-semibold text-[#666]">已使用</th>
                <th className="h-10 w-[114px] px-3 text-right text-[12px] font-semibold text-[#666]">未使用</th>
                <th className="h-10 w-[100px] px-3 text-center text-[13px] font-semibold text-[#666]">操作</th>
              </tr>
            </thead>
            <tbody>
              {company.lines.map((l, i) => (
                <tr key={i} className="border-b border-[#e9ebec] last:border-b-0 hover:bg-[#fafafa]">
                  <td className="h-14 max-w-[200px] px-3 text-[13px] font-medium text-[#323232]"><span className="block truncate">{l.product}</span></td>
                  <td className="h-14 px-3">
                    <span className="inline-flex items-center rounded border border-[#dce2e8] bg-[#eef1f5] px-2 py-0.5 text-xs text-[#666]">
                      {l.spec}
                    </span>
                  </td>
                  <td className="h-14 px-3">
                    {l.isDefault ? (
                      <span className="inline-flex items-center rounded border border-[#ffc799] bg-[#fff3e8] px-2 py-0.5 text-xs font-medium text-[#ff7f32]">是</span>
                    ) : (
                      <span className="inline-flex items-center rounded border border-[#dce2e8] bg-[#f0f2f5] px-2 py-0.5 text-xs font-medium text-[#969696]">否</span>
                    )}
                  </td>
                  <td className="h-14 px-3 text-right text-[13px] font-medium text-[#323232]">{l.total}</td>
                  <td className="h-14 px-3 text-right text-[13px] font-medium text-[#323232]">{l.used}</td>
                  <td className="h-14 px-3 text-right text-[13px] font-medium text-[#323232]">{l.total - l.used}</td>
                  <td className="h-14 px-3">
                    <div className="flex items-center justify-center gap-3">
                      <button className="cursor-pointer text-[13px] font-medium text-[#ff7f32] hover:underline">配置</button>
                      <button className="cursor-pointer text-base leading-none text-[#666] hover:text-[#323232]">⋯</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
