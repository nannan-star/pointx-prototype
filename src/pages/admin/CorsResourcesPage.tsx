import { useState, useMemo, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import { CorsDetailDrawer } from '@/components/CorsDetailDrawer'
import { CorsEditDrawer } from '@/components/CorsEditDrawer'
import { CorsOpenAccountDrawer } from '@/components/CorsOpenAccountDrawer'
import { SearchFilterBar, type FilterValue, type DateRange } from '@/components/SearchFilterBar'
import { corsResources, type CorsResource } from '@/data/resource-mock'
import { cn } from '@/lib/utils'

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'company', label: '企业名称', type: 'text' as const, placeholder: '请输入企业名称关键词' },
  { key: 'account', label: '账号名', type: 'text' as const, placeholder: '请输入账号名' },
  { key: 'product', label: '商品名称', type: 'text' as const, placeholder: '请输入商品名称' },
  { key: 'spec', label: '规格', type: 'text' as const, placeholder: '请输入规格关键词' },
]

const FILTER_FIELDS_ADMIN = [
  { key: 'company', label: '企业名称', type: 'text' as const, placeholder: '请输入企业名称' },
  { key: 'account', label: '账号名', type: 'text' as const, placeholder: '请输入账号名' },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '启用', value: '启用' },
    { label: '禁用', value: '禁用' },
  ] },
  { key: 'activateStatus', label: '激活状态', type: 'select' as const, options: [
    { label: '已激活', value: '已激活' },
    { label: '待激活', value: '待激活' },
  ] },
  { key: 'region', label: '区域', type: 'text' as const, placeholder: '请输入区域' },
  { key: 'product', label: '商品名称', type: 'text' as const, placeholder: '请输入商品名称' },
  { key: 'spec', label: '规格', type: 'text' as const, placeholder: '请输入规格关键词' },
  { key: 'startAt', label: '激活时间', type: 'date' as const },
  { key: 'expireAt', label: '到期时间', type: 'date' as const },
]

const FILTER_FIELDS_CLIENT = FILTER_FIELDS_ADMIN.filter(
  (f) => f.key !== 'company'
)

/* ---- Filter helpers ---- */

function cellString(r: CorsResource, key: string): string {
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

interface CorsResourcesPageProps {
  isClientView?: boolean
}

export default function CorsResourcesPage({ isClientView = false }: CorsResourcesPageProps) {
  const filterFields = isClientView ? FILTER_FIELDS_CLIENT : FILTER_FIELDS_ADMIN

  /* applied filter state */
  const [appliedSearchField, setAppliedSearchField] = useState('company')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})

  const [detailAccount, setDetailAccount] = useState<string | null>(null)
  const [editAccount, setEditAccount] = useState<string | null>(null)
  const [openAccountOpen, setOpenAccountOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
    return corsResources.filter((r) => {
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

  useEffect(() => { setPage(1) }, [appliedSearchValue, appliedSearchField, appliedFilters, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const detailRow = detailAccount ? corsResources.find((r) => r.account === detailAccount) : undefined
  const editRow = editAccount ? corsResources.find((r) => r.account === editAccount) : undefined
  const colCount = isClientView ? 9 : 10

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">CORS 账号</h1>
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
          <Button
            onClick={() => setOpenAccountOpen(true)}
            className="h-9 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-4 text-sm font-normal text-white hover:bg-[#ff6a14]"
          >
            开通账号
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              {!isClientView && <TableHead className="h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">企业名称</TableHead>}
              {isClientView && <TableHead className="h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">账号名</TableHead>}
              {!isClientView && <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">账号名</TableHead>}
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">密码</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">到期时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">剩余时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品</TableHead>
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
                  当前筛选条件下暂无 CORS 账号
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((r, i) => {
                const globalIndex = (safePage - 1) * pageSize + i
                const striped = globalIndex % 2 === 1
                return (
                  <CorsRow
                    key={r.account}
                    resource={r}
                    isClientView={isClientView}
                    onEdit={() => setEditAccount(r.account)}
                    onDetail={() => setDetailAccount(r.account)}
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

      <CorsDetailDrawer
        open={!!detailAccount}
        onOpenChange={(open) => { if (!open) setDetailAccount(null) }}
        resource={detailRow}
      />

      <CorsEditDrawer
        open={!!editAccount}
        onOpenChange={(open) => { if (!open) setEditAccount(null) }}
        resource={editRow}
        onSave={(account, remark) => {
          alert(`已保存账号「${account}」备注：${remark || '（空）'}（演示）`)
        }}
      />

      <CorsOpenAccountDrawer
        open={openAccountOpen}
        onOpenChange={setOpenAccountOpen}
        isClientView={isClientView}
      />
    </div>
  )
}

interface CorsRowProps {
  resource: CorsResource
  isClientView: boolean
  onEdit: () => void
  onDetail: () => void
  striped: boolean
}

function CorsRow({ resource: r, isClientView, onEdit, onDetail, striped }: CorsRowProps) {
  const cell = (v: string) => v?.trim() || '—'
  const stNorm = r.status?.trim() || ''

  return (
    <TableRow className={cn(
      'group border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
      striped && 'bg-[rgba(233,235,236,0.2)]'
    )}>
      {!isClientView && <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232] whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>{cell(r.company)}</TableCell>}
      <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232]", isClientView && "sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>{cell(r.account)}</TableCell>
      <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{cell(r.password)}</TableCell>
      <TableCell className="px-4 py-3"><StatusBadge status={r.status} variant="cors" /></TableCell>
      <TableCell className="px-4 py-3"><StatusBadge status={r.activateStatus} variant="activate" /></TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.startAt)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.expireAt)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.remaining)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.product)}</TableCell>
      <TableCell className={cn("px-4 py-3 text-right sticky right-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
            onClick={onEdit}
          >
            编辑
          </button>
          <button
            type="button"
            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
            onClick={onDetail}
          >
            详情
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
              >
                更多
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => alert('修改密码（演示）')}>修改密码</DropdownMenuItem>
              <DropdownMenuItem disabled={stNorm === '启用'} onClick={() => alert('启用（演示）')}>启用</DropdownMenuItem>
              <DropdownMenuItem disabled={stNorm === '禁用'} onClick={() => alert('禁用（演示）')}>禁用</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}
