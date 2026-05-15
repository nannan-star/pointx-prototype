import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { instances, type Instance } from '@/data/instance-mock'
import { InstanceCreateDrawer } from '@/components/InstanceCreateDrawer'
import { InstanceEditDrawer } from '@/components/InstanceEditDrawer'
import { SearchFilterBar, type FilterValue, type DateRange } from '@/components/SearchFilterBar'
import { cn } from '@/lib/utils'

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'company', label: '企业名称', type: 'text' as const, placeholder: '请输入企业名称' },
  { key: 'name', label: '实例名称', type: 'text' as const, placeholder: '请输入实例名称' },
  { key: 'accountPrefix', label: '帐号前缀', type: 'text' as const, placeholder: '请输入帐号前缀' },
  { key: 'packageNames', label: 'SDK套餐', type: 'text' as const, placeholder: '请输入套餐名称' },
]

const FILTER_FIELDS = [
  { key: 'company', label: '企业名称', type: 'text' as const, placeholder: '请输入企业名称' },
  { key: 'name', label: '实例名称', type: 'text' as const, placeholder: '请输入实例名称' },
  { key: 'accountPrefix', label: '帐号前缀', type: 'text' as const, placeholder: '请输入帐号前缀' },
  { key: 'packageNames', label: 'SDK套餐', type: 'text' as const, placeholder: '请输入套餐名称' },
]

/* ---- Filter helpers ---- */

function cellString(r: Instance, key: string): string {
  const v = (r as unknown as Record<string, unknown>)[key]
  if (Array.isArray(v)) return v.join(' ')
  return typeof v === 'string' ? v : ''
}

function matchField(value: FilterValue, cellStr: string): boolean {
  if (typeof value === 'string') {
    return cellStr.toLowerCase().includes(value.trim().toLowerCase())
  }
  return true
}

export default function InstancesPage() {
  const [rows, setRows] = useState<Instance[]>(instances)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [guideName, setGuideName] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /* applied filter state */
  const [appliedSearchField, setAppliedSearchField] = useState('company')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})

  const hasActiveFilters = useMemo(() => {
    return FILTER_FIELDS.some((f) => {
      const v = appliedFilters[f.key]
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'object' && v !== null && ('from' in v || 'to' in v)) {
        const r = v as DateRange
        return !!(r.from || r.to)
      }
      return typeof v === 'string' && v.trim() !== ''
    })
  }, [appliedFilters])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!matchField(appliedSearchValue, cellString(r, appliedSearchField))) return false
      for (const f of FILTER_FIELDS) {
        const v = appliedFilters[f.key]
        if (v === undefined) continue
        if (!matchField(v, cellString(r, f.key))) return false
      }
      return true
    })
  }, [rows, appliedSearchField, appliedSearchValue, appliedFilters])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [appliedSearchValue, appliedSearchField, appliedFilters, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  function handleCreated(name: string) {
    setGuideName(name)
    setRows([...instances])
  }

  function handleEditSaved() {
    setEditTarget(null)
    setRows([...instances])
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      {guideName && (
        <div
          className="flex items-center justify-between rounded-lg border border-[#e9ebec] bg-[#fff3e5] px-4 py-3 shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]"
          role="status"
        >
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-[#323232]">实例「{guideName}」已创建</p>
            <p className="text-xs text-[#969696]">
              建议尽快配置 <strong className="text-[#323232]">SDK 服务套餐</strong>
              ，便于资源池履约与开通。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] text-[#f9f9f9] hover:bg-[#ff6a14]"
              onClick={() => {
                setEditTarget(guideName)
                setGuideName(null)
              }}
            >
              去配置 SDK 套餐
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[#323232] hover:bg-white/60"
              onClick={() => setGuideName(null)}
            >
              知道了
            </Button>
          </div>
        </div>
      )}

      <SearchFilterBar
        searchFields={SEARCH_FIELDS}
        filterFields={FILTER_FIELDS}
        hasActiveFilters={hasActiveFilters}
        onApply={({ searchField, searchValue, filters }) => {
          setAppliedSearchField(searchField)
          setAppliedSearchValue(searchValue)
          setAppliedFilters(filters)
        }}
        onReset={() => {
          setAppliedSearchField('company')
          setAppliedSearchValue('')
          setAppliedFilters({})
        }}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 shrink-0 gap-1 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-4 text-sm font-normal text-white hover:bg-[#ff6a14]"
          >
            新增实例
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">
                企业名称
              </TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                实例名称
              </TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                设备自动入库
              </TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                激活方式
              </TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                帐号前缀
              </TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                SDK套餐状态
              </TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                绑定套餐
              </TableHead>
              <TableHead className="h-10 sticky right-0 z-20 rounded-tr-lg bg-[#f2f3f4] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              const configured = r.packageNames.length > 0
              return (
                <TableRow
                  key={r.name}
                  className={cn(
                    'group border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                    striped && 'bg-[rgba(233,235,236,0.2)]'
                  )}
                >
                  <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232] sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
                    {r.company}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px]">
                    <Link
                      to={`/admin/instances/detail?name=${encodeURIComponent(r.name)}`}
                      className="text-[#ff7f32] underline decoration-solid underline-offset-2 hover:text-[#e56718]"
                    >
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">
                    {r.deviceAutoStock || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">
                    {r.activateMode || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-[14px] leading-[22px] text-[#323232]">
                    {r.accountPrefix || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {configured ? (
                      <span className="inline-flex h-6 items-center rounded-lg bg-[#e9f7eb] px-2 text-[14px] leading-[22px] text-[#35b85e]">
                        已配置
                      </span>
                    ) : (
                      <span className="inline-flex h-6 items-center rounded-lg bg-[#fff3e5] px-2 text-[14px] leading-[22px] text-[#ff7f32]">
                        未配置
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] px-4 py-3 text-[14px] leading-[22px] text-[#323232]">
                    {configured ? (
                      <div className="flex flex-wrap gap-1">
                        {r.packageNames.map((n) => (
                          <span
                            key={n}
                            className="inline-flex items-center rounded-lg border border-[#e9ebec] bg-white px-2 py-0.5 text-xs text-[#323232]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#969696]">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("px-4 py-3 text-right sticky right-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
                    <div className="flex justify-end gap-2">
                      {configured ? (
                        <button
                          type="button"
                          onClick={() => setEditTarget(r.name)}
                          className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        >
                          编辑
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditTarget(r.name)}
                          className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        >
                          配置
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-[#e9ebec] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#969696]">共 {total} 条</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-[#e9ebec] bg-white text-[#323232] hover:bg-[#f9f9f9]"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <span className="text-sm text-[#323232]">
              {safePage} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-[#e9ebec] bg-white text-[#323232] hover:bg-[#f9f9f9]"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              下一页
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[120px] border-[#e9ebec] bg-white text-sm text-[#323232]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="20">20 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <InstanceCreateDrawer open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <InstanceEditDrawer
        instanceName={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        onSaved={handleEditSaved}
      />
    </div>
  )
}
