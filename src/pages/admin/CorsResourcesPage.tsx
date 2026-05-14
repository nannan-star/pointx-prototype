import { useState, useMemo, useEffect } from 'react'
import { Search, Settings2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { CorsOpenAccountDrawer } from '@/components/CorsOpenAccountDrawer'
import { corsResources, type CorsResource } from '@/data/resource-mock'
import { cn } from '@/lib/utils'

interface CorsResourcesPageProps {
  isClientView?: boolean
}

export default function CorsResourcesPage({ isClientView = false }: CorsResourcesPageProps) {
  const [query, setQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [detailAccount, setDetailAccount] = useState<string | null>(null)
  const [openAccountOpen, setOpenAccountOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return corsResources.filter((r) => {
      const kw = query.trim().toLowerCase()
      const matchKw = !kw || r.company.toLowerCase().includes(kw) || r.account.toLowerCase().includes(kw) || r.product.toLowerCase().includes(kw)
      const matchRegion = !filterRegion || r.region === filterRegion
      const matchSpec = !filterSpec || r.spec.includes(filterSpec) || r.product.includes(filterSpec)
      return matchKw && matchRegion && matchSpec
    })
  }, [query, filterRegion, filterSpec])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [query, filterRegion, filterSpec, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const pageSub = isClientView
    ? '外置 CORS 账号明细；大客户视图不展示企业名称列。'
    : 'CORS 外置账号资源明细；本页可开通 CORS 账号，并查看账号消耗情况。'

  const detailRow = detailAccount ? corsResources.find((r) => r.account === detailAccount) : undefined
  const colCount = isClientView ? 9 : 10

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">CORS 账号</h1>
        <p className="text-sm text-[#969696] mt-1">{pageSub}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#969696]" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="企业/账号/商品关键词"
              className="h-9 border-[#e9ebec] bg-white pl-9 text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
            />
          </div>
          <Input
            placeholder="区域"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="h-9 w-36 border-[#e9ebec] bg-white text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
          />
          <Input
            placeholder="规格关键词"
            value={filterSpec}
            onChange={(e) => setFilterSpec(e.target.value)}
            className="h-9 w-48 border-[#e9ebec] bg-white text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
          />
        </div>
        <Button
          onClick={() => setOpenAccountOpen(true)}
          className="h-8 shrink-0 gap-1 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-[#f9f9f9] hover:bg-[#ff6a14]"
        >
          开通账号
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              {!isClientView && <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">企业名称</TableHead>}
              {isClientView && <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">账号名</TableHead>}
              {!isClientView && <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">账号名</TableHead>}
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">密码</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">激活时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">到期时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">剩余时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品</TableHead>
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
  onDetail: () => void
  striped: boolean
}

function CorsRow({ resource: r, isClientView, onDetail, striped }: CorsRowProps) {
  const cell = (v: string) => v?.trim() || '—'
  const stNorm = r.status?.trim() || ''

  return (
    <TableRow className={cn(
      'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
      striped && 'bg-[rgba(233,235,236,0.2)]'
    )}>
      {!isClientView && <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232] whitespace-nowrap">{cell(r.company)}</TableCell>}
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.account)}</TableCell>
      <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{cell(r.password)}</TableCell>
      <TableCell className="px-4 py-3"><StatusBadge status={r.status} variant="cors" /></TableCell>
      <TableCell className="px-4 py-3"><StatusBadge status={r.activateStatus} variant="activate" /></TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.startAt)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.expireAt)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.remaining)}</TableCell>
      <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{cell(r.product)}</TableCell>
      <TableCell className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
            onClick={() => alert('编辑（演示）')}
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
