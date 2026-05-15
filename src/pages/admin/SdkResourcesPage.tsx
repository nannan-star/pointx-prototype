import { useState, useMemo, useEffect } from 'react'
import { Settings2, Eye, EyeOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import { SdkResourceDetailDrawer } from '@/components/SdkResourceDetailDrawer'
import { SdkOpenAccountDrawer } from '@/components/SdkOpenAccountDrawer'
import { SearchFilterBar, type FilterValue, type DateRange } from '@/components/SearchFilterBar'
import { sdkResources, type SdkResource } from '@/data/resource-mock'
import { cn } from '@/lib/utils'

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'company', label: '企业名称', type: 'text' as const, placeholder: '请输入企业名称关键词' },
  { key: 'instance', label: '实例名称', type: 'text' as const, placeholder: '请输入实例名称' },
  { key: 'sn', label: '设备 ID/SN', type: 'text' as const, placeholder: '请输入设备 ID 或 SN' },
  { key: 'product', label: '商品名称', type: 'text' as const, placeholder: '请输入商品名称' },
  { key: 'regCode', label: '注册码', type: 'text' as const, placeholder: '请输入注册码' },
]

const FILTER_FIELDS_ADMIN = [
  { key: 'company', label: '企业名称', type: 'text' as const, placeholder: '请输入企业名称' },
  { key: 'instance', label: '实例名称', type: 'text' as const, placeholder: '请输入实例名称' },
  { key: 'sn', label: '设备 ID/SN', type: 'text' as const, placeholder: '请输入 SN' },
  { key: 'deviceType', label: '设备类型', type: 'text' as const, placeholder: '请输入设备类型' },
  { key: 'activateStatus', label: '激活状态', type: 'select' as const, options: [
    { label: '已激活', value: '已激活' },
    { label: '未激活', value: '未激活' },
  ] },
  { key: 'status', label: '服务状态', type: 'select' as const, options: [
    { label: '正常', value: '正常' },
    { label: '停用', value: '停用' },
    { label: '过期', value: '过期' },
  ] },
  { key: 'activatedAt', label: '激活时间', type: 'date' as const },
  { key: 'expireAt', label: '到期时间', type: 'date' as const },
  { key: 'remaining', label: '剩余时长', type: 'text' as const, placeholder: '请输入剩余时长' },
  { key: 'product', label: '商品名称', type: 'text' as const, placeholder: '请输入商品名称' },
  { key: 'regCode', label: '注册码', type: 'text' as const, placeholder: '请输入注册码' },
  { key: 'activateMode', label: '激活方式', type: 'select' as const, options: [
    { label: '自动激活', value: '自动激活' },
    { label: '手动激活', value: '手动激活' },
  ] },
  { key: 'entryMode', label: '入库方式', type: 'select' as const, options: [
    { label: '手动入库', value: '手动入库' },
    { label: '批量导入', value: '批量导入' },
  ] },
]

const FILTER_FIELDS_CLIENT = FILTER_FIELDS_ADMIN.filter(
  (f) => f.key !== 'company' && f.key !== 'instance'
)

/* ---- Filter helpers ---- */

function cellString(r: SdkResource, key: string): string {
  const v = (r as unknown as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : ''
}

function matchField(value: FilterValue, cellStr: string): boolean {
  if (typeof value === 'string') {
    return cellStr.toLowerCase().includes(value.trim().toLowerCase())
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return true
    return value.some((v) => cellStr.toLowerCase().includes(v.toLowerCase()))
  }
  if (typeof value === 'object' && value !== null && ('from' in value || 'to' in value)) {
    const range = value as DateRange
    if (!range.from && !range.to) return true
    const cell = cellStr.trim()
    if (!cell) return false
    const cellDate = new Date(cell.replace(/\//g, '-'))
    if (isNaN(cellDate.getTime())) return false
    if (range.from && cellDate < range.from) return false
    if (range.to) {
      const toEnd = new Date(range.to)
      toEnd.setHours(23, 59, 59, 999)
      if (cellDate > toEnd) return false
    }
    return true
  }
  return true
}

/* ------------------------------------------------------------------ */

interface SdkResourcesPageProps {
  isClientView?: boolean
}

export default function SdkResourcesPage({ isClientView = false }: SdkResourcesPageProps) {
  const filterFields = isClientView ? FILTER_FIELDS_CLIENT : FILTER_FIELDS_ADMIN

  /* applied filter state (driven by SearchFilterBar callbacks) */
  const [appliedSearchField, setAppliedSearchField] = useState('company')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [detailKey, setDetailKey] = useState<string | null>(null)
  const [openAccountOpen, setOpenAccountOpen] = useState(false)
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [batchActivateConfirmOpen, setBatchActivateConfirmOpen] = useState(false)

  const hasActiveFilters = useMemo(() => {
    return filterFields.some((f) => {
      const v = appliedFilters[f.key]
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'object' && v !== null && ('from' in v || 'to' in v)) {
        const r = v as DateRange
        return !!(r.from || r.to)
      }
      return typeof v === 'string' && v.trim() !== ''
    })
  }, [appliedFilters, filterFields])

  const filtered = useMemo(() => {
    return sdkResources.filter((r) => {
      if (!matchField(appliedSearchValue, cellString(r, appliedSearchField))) return false
      for (const f of filterFields) {
        const v = appliedFilters[f.key]
        if (v === undefined) continue
        if (!matchField(v, cellString(r, f.key))) return false
      }
      return true
    })
  }, [appliedSearchField, appliedSearchValue, appliedFilters, filterFields])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  const activatableSelected = useMemo(() => {
    const items: SdkResource[] = []
    for (const k of selectedKeys) {
      const row = sdkResources.find((r) => r.sdkResKey === k)
      if (row && row.activateStatus !== '已激活') items.push(row)
    }
    return items
  }, [selectedKeys])

  const activatableSelectedCount = activatableSelected.length

  const runBatchActivateDemo = () => {
    setBatchActivateConfirmOpen(false)
    alert(`已为 ${activatableSelectedCount} 条未激活资源提交批量激活（演示）`)
  }

  useEffect(() => { setPage(1) }, [appliedSearchValue, appliedSearchField, appliedFilters, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selectedKeys.has(r.sdkResKey))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(pageRows.map((r) => r.sdkResKey)))
    }
  }

  const toggleRow = (key: string) => {
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelectedKeys(next)
  }

  const toggleReveal = (key: string) => {
    const next = new Set(revealedCodes)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setRevealedCodes(next)
  }

  const detailRow = detailKey ? sdkResources.find((r) => r.sdkResKey === detailKey) : undefined
  const colCount = isClientView ? 14 : 16

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">SDK 资源</h1>
      </div>

      <SearchFilterBar
        searchFields={SEARCH_FIELDS}
        filterFields={filterFields}
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
          <>
            <Button
              type="button"
              variant="outline"
              disabled={selectedKeys.size === 0}
              onClick={() => {
                if (activatableSelectedCount === 0) {
                  alert('所选资源均已激活，无需重复操作')
                  return
                }
                setBatchActivateConfirmOpen(true)
              }}
              className="h-9 min-h-9 cursor-pointer gap-1.5 rounded-lg border-[#e9ebec] bg-white px-3 text-sm font-normal text-[#323232] hover:bg-[#f9f9f9] focus-visible:border-[#ff7f32] focus-visible:ring-[3px] focus-visible:ring-[#ff7f32]/25 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              <Zap className="size-3.5 text-[#ff7f32]" strokeWidth={2} />
              批量激活
              {selectedKeys.size > 0 && (
                <span className="rounded bg-[#ff7f32]/15 px-1 py-0.5 text-[11px] font-medium text-[#ff7f32] tabular-nums">
                  {activatableSelectedCount}/{selectedKeys.size}
                </span>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setOpenAccountOpen(true)}
              className="h-9 min-h-9 shrink-0 cursor-pointer gap-1.5 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-white hover:bg-[#ff6a14] focus-visible:ring-[3px] focus-visible:ring-[#ff7f32]/40 motion-reduce:transition-none"
            >
              开通账号
            </Button>
          </>
        }
      />

      <Dialog open={batchActivateConfirmOpen} onOpenChange={setBatchActivateConfirmOpen}>
        <DialogContent className="border-[#e9ebec] bg-white text-[#323232] sm:max-w-lg p-0">
          <DialogHeader className="border-b border-[#e9ebec] px-6 py-4">
            <DialogTitle className="text-sm font-semibold text-[#323232]">批量激活</DialogTitle>
            <DialogDescription className="text-sm text-[#646464]">
              将为以下 <span className="font-semibold text-[#323232] tabular-nums">{activatableSelectedCount}</span> 条未激活资源发起批量激活。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[320px] overflow-y-auto px-6 py-3">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-b border-[#e9ebec] hover:bg-transparent">
                  <TableHead className="h-9 bg-[rgba(233,235,236,0.4)] text-xs font-semibold text-[#323232]">设备 ID/SN</TableHead>
                  <TableHead className="h-9 bg-[rgba(233,235,236,0.4)] text-xs font-semibold text-[#323232]">设备类型</TableHead>
                  {!isClientView && <TableHead className="h-9 bg-[rgba(233,235,236,0.4)] text-xs font-semibold text-[#323232]">企业名称</TableHead>}
                  <TableHead className="h-9 bg-[rgba(233,235,236,0.4)] text-xs font-semibold text-[#323232]">激活状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activatableSelected.map((r) => (
                  <TableRow key={r.sdkResKey} className="border-b border-[#e9ebec] last:border-b-0 hover:bg-transparent">
                    <TableCell className="py-2.5 text-sm text-[#323232]">{r.sn}</TableCell>
                    <TableCell className="py-2.5 text-sm text-[#323232]">{r.deviceType}</TableCell>
                    {!isClientView && <TableCell className="py-2.5 text-sm text-[#323232]">{r.company}</TableCell>}
                    <TableCell className="py-2.5"><StatusBadge status={r.activateStatus} variant="activate" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-6 py-3">
            <Button
              variant="outline"
              onClick={() => setBatchActivateConfirmOpen(false)}
              className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]"
            >
              取消
            </Button>
            <Button
              onClick={runBatchActivateDemo}
              className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
            >
              确认激活
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-[52px] min-w-[52px] h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-3 text-xs font-semibold text-[#323232]">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="全选" />
              </TableHead>
              {!isClientView && <TableHead className="h-10 sticky left-[52px] z-20 bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">企业名称</TableHead>}
              {!isClientView && <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">实例名称</TableHead>}
              <TableHead className={cn("h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]", isClientView && "sticky left-[52px] z-20 bg-[#f2f3f4]")}>设备 ID/SN</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">设备类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">服务状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">到期时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">剩余时长</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">注册码</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活方式</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">入库方式</TableHead>
              <TableHead className="h-10 sticky right-0 z-20 rounded-tr-lg bg-[#f2f3f4] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-[#969696] py-8">
                  当前筛选条件下暂无 SDK 资源
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((r, i) => {
                const globalIndex = (safePage - 1) * pageSize + i
                const striped = globalIndex % 2 === 1
                return (
                  <SdkResourceRow
                    key={r.sdkResKey}
                    resource={r}
                    isClientView={isClientView}
                    selected={selectedKeys.has(r.sdkResKey)}
                    onToggle={() => toggleRow(r.sdkResKey)}
                    codeRevealed={revealedCodes.has(r.sdkResKey)}
                    onToggleReveal={() => toggleReveal(r.sdkResKey)}
                    onDetail={() => setDetailKey(r.sdkResKey)}
                    striped={striped}
                  />
                )
              })
            )}
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
            <span className="text-sm text-[#323232]">{safePage} / {pageCount}</span>
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
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
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

      <SdkResourceDetailDrawer
        open={!!detailKey}
        onOpenChange={(open) => { if (!open) setDetailKey(null) }}
        resource={detailRow}
      />

      <SdkOpenAccountDrawer
        open={openAccountOpen}
        onOpenChange={setOpenAccountOpen}
        isClientView={isClientView}
      />
    </div>
  )
}

/* ---- Row component (unchanged) ---- */

interface SdkResourceRowProps {
  resource: SdkResource
  isClientView: boolean
  selected: boolean
  onToggle: () => void
  codeRevealed: boolean
  onToggleReveal: () => void
  onDetail: () => void
  striped: boolean
}

function SdkResourceRow({
  resource: r, isClientView, selected, onToggle, codeRevealed, onToggleReveal, onDetail, striped,
}: SdkResourceRowProps) {
  const activated = r.activateStatus === '已激活'
  const cell = (v: string) => v?.trim() || '—'

  const regCodeDisplay = () => {
    if (!r.regCode) return '—'
    if (codeRevealed) return r.regCode
    return '••••••••'
  }

  return (
    <TableRow className={cn(
      'group border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
      striped && 'bg-[rgba(233,235,236,0.2)]'
    )}>
      <TableCell className={cn("w-[52px] min-w-[52px] px-3 py-3 sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`选择 ${r.sn}`} />
      </TableCell>
      {!isClientView && <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232] whitespace-nowrap sticky left-[52px] z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>{cell(r.company)}</TableCell>}
      {!isClientView && <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.instance)}</TableCell>}
      <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232]", isClientView && "sticky left-[52px] z-10 bg-white group-hover:bg-[#fbfbfc]", isClientView && striped && "bg-[#f8f9f9]")}>{cell(r.sn)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.deviceType)}</TableCell>
      <TableCell className="px-4 py-3"><StatusBadge status={r.activateStatus} variant="activate" /></TableCell>
      <TableCell className="px-4 py-3"><StatusBadge status={r.status} variant="service" /></TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.activatedAt)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.expireAt)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.remaining)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.product)}</TableCell>
      <TableCell className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-[#323232]">{regCodeDisplay()}</span>
          {r.regCode && (
            <button
              type="button"
              onClick={onToggleReveal}
              className="ml-1 text-[#969696] hover:text-[#323232] transition-colors"
              aria-label={codeRevealed ? '隐藏注册码' : '显示注册码'}
            >
              {codeRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.activateMode)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.entryMode)}</TableCell>
      <TableCell className={cn("px-4 py-3 text-right sticky right-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={activated || !r.sdkResKey}
            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => alert('激活（演示）')}
          >
            激活
          </button>
          <button
            type="button"
            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
            onClick={() => alert('排障（演示）')}
          >
            排障
          </button>
          <button
            type="button"
            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
            onClick={onDetail}
          >
            详情
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}
