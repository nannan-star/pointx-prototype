import { useState, useMemo, useEffect } from 'react'
import { Plus, Settings2, Eye, EyeOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

const BATCH_ACTIVATE_TOOLTIP_LINES = [
  '批量激活：对已勾选且「激活状态 ≠ 已激活」的资源统一发起激活。',
  '1) 先在左侧勾选复选框；',
  '2) 点「批量操作」→「批量激活」；',
  '3) 确认后一次性提交（演示环境不调用真实接口）。',
]

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
  const [batchMenuOpen, setBatchMenuOpen] = useState(false)

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

  const activatableSelectedCount = useMemo(() => {
    let n = 0
    for (const k of selectedKeys) {
      const row = sdkResources.find((r) => r.sdkResKey === k)
      if (row && row.activateStatus !== '已激活') n += 1
    }
    return n
  }, [selectedKeys])

  const openBatchActivateConfirm = () => {
    if (activatableSelectedCount === 0) return
    setBatchMenuOpen(false)
    window.setTimeout(() => setBatchActivateConfirmOpen(true), 0)
  }

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

  const pageSub = isClientView
    ? '大客户视图不展示企业名称、实例名称；注册码仅已激活账号具备，列表默认遮挡，请点击眼睛图标查看完整码。'
    : 'SDK 履约资源明细；注册码仅已激活账号具备，列表默认密文，请点击眼睛图标显示明文。'

  const detailRow = detailKey ? sdkResources.find((r) => r.sdkResKey === detailKey) : undefined
  const colCount = isClientView ? 14 : 16

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">SDK 资源</h1>
        <p className="text-sm text-[#969696] mt-1">{pageSub}</p>
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
          <TooltipProvider delayDuration={150} skipDelayDuration={100}>
            <DropdownMenu open={batchMenuOpen} onOpenChange={setBatchMenuOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={selectedKeys.size === 0}
                  className="h-9 min-h-9 cursor-pointer rounded-lg border-[#e9ebec] bg-white px-3 text-sm font-normal text-[#323232] hover:bg-[#f9f9f9] focus-visible:border-[#ff7f32] focus-visible:ring-[3px] focus-visible:ring-[#ff7f32]/25 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                  批量操作
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={6}
                collisionPadding={16}
                className={cn(
                  'z-[100] w-56 min-w-[14rem] max-h-[min(22rem,85dvh)] overflow-y-auto border-[#e9ebec] p-0 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)]'
                )}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="p-1">
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md text-[#323232] focus:bg-[#f9f9f9]"
                    onClick={() => {
                      setBatchMenuOpen(false)
                      alert('导出选中（演示）')
                    }}
                  >
                    导出选中
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="m-0 bg-[#e9ebec]" />
                <div className="min-h-[3.25rem] bg-[#f9f9f9] p-2">
                  <div className="flex items-stretch gap-1.5">
                    <DropdownMenuItem
                      disabled={activatableSelectedCount === 0}
                      onSelect={(e) => {
                        e.preventDefault()
                        openBatchActivateConfirm()
                      }}
                      className={cn(
                        'flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-normal outline-none select-none',
                        'border-[#ffcda8] bg-[#fff8f3] text-[#d45a00] hover:bg-[#fff0e6] hover:text-[#b84a00]',
                        'focus:bg-[#fff0e6] focus:text-[#b84a00] data-[highlighted]:bg-[#fff0e6] data-[highlighted]:text-[#b84a00]',
                        'data-[disabled]:cursor-not-allowed data-[disabled]:border-[#e9ebec] data-[disabled]:bg-white data-[disabled]:text-[#969696] data-[disabled]:opacity-100'
                      )}
                      aria-label={
                        activatableSelectedCount > 0
                          ? `批量激活，已选 ${activatableSelectedCount} 条可激活资源`
                          : '批量激活（请先勾选未激活资源）'
                      }
                    >
                      <Zap className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                      <span className="truncate">批量激活</span>
                      {selectedKeys.size > 0 && (
                        <span className="ml-0.5 shrink-0 rounded bg-[#ff7f32]/15 px-1 py-0.5 text-[10px] font-medium text-[#ff7f32] tabular-nums">
                          {activatableSelectedCount}/{selectedKeys.size}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold leading-none outline-none transition-colors motion-reduce:transition-none',
                            'border-[#e9ebec] bg-white text-[#969696] hover:border-[#ffcda8] hover:bg-[#fff8f3] hover:text-[#ff7f32]',
                            'focus-visible:border-[#ff7f32] focus-visible:ring-[3px] focus-visible:ring-[#ff7f32]/25'
                          )}
                          aria-label="查看批量激活说明"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <span aria-hidden className="select-none">?</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" align="center" className="w-[min(280px,calc(100vw-2rem))]">
                        <div className="space-y-1.5 text-left">
                          {BATCH_ACTIVATE_TOOLTIP_LINES.map((line, i) => (
                            <p key={line} className={i === 0 ? 'text-[#323232]' : 'text-[#969696]'}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              onClick={() => setOpenAccountOpen(true)}
              className="h-9 min-h-9 shrink-0 cursor-pointer gap-1.5 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-white hover:bg-[#ff6a14] focus-visible:ring-[3px] focus-visible:ring-[#ff7f32]/40 motion-reduce:transition-none"
            >
              开通账号
            </Button>
          </TooltipProvider>
        }
      />

      <AlertDialog open={batchActivateConfirmOpen} onOpenChange={setBatchActivateConfirmOpen}>
        <AlertDialogContent className="border-[#e9ebec] bg-white text-[#323232] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#323232]">确认批量激活</AlertDialogTitle>
            <AlertDialogDescription className="text-[#646464]">
              将为当前勾选中 <span className="font-semibold text-[#323232] tabular-nums">{activatableSelectedCount}</span>{' '}
              条<strong className="font-medium text-[#323232]">未激活</strong>资源发起批量激活（演示环境不调用真实接口）。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="cursor-pointer border-[#e9ebec] bg-white text-[#323232] hover:bg-[#f9f9f9]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={runBatchActivateDemo}
              className="cursor-pointer border border-[#ffa05c] bg-[#ff7f32] text-white hover:bg-[#ff6a14] focus-visible:ring-[#ff7f32]/40"
            >
              确认激活
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-10 h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="全选" />
              </TableHead>
              {!isClientView && <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">企业名称</TableHead>}
              {!isClientView && <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">实例名称</TableHead>}
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">设备 ID/SN</TableHead>
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
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
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
      'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
      striped && 'bg-[rgba(233,235,236,0.2)]'
    )}>
      <TableCell className="px-4 py-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`选择 ${r.sn}`} />
      </TableCell>
      {!isClientView && <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232] whitespace-nowrap">{cell(r.company)}</TableCell>}
      {!isClientView && <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.instance)}</TableCell>}
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.sn)}</TableCell>
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
      <TableCell className="px-4 py-3 text-right">
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
