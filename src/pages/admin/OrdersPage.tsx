import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { OrderResourceDrawer } from '@/components/OrderResourceDrawer'
import { ordersMock, type Order } from '@/data/order-mock'
import { cn } from '@/lib/utils'

function orderStatusClass(status: string): string {
  if (status === '已支付' || status === '已付款' || status === '已完成') {
    return 'bg-[#e9f7eb] text-[#35b85e] border-[#e9f7eb]'
  }
  if (status === '待处理' || status === '待付款') {
    return 'bg-[#fff3e5] text-[#ff7f32] border-[#fff3e5]'
  }
  return 'bg-[rgba(233,235,236,0.4)] text-[#969696] border-[rgba(233,235,236,0.4)]'
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordersMock
    return ordersMock.filter(
      (o) =>
        (o.customer || '').toLowerCase().includes(q) ||
        o.no.toLowerCase().includes(q) ||
        (o.title || '').toLowerCase().includes(q) ||
        (o.product || '').toLowerCase().includes(q)
    )
  }, [query])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [query, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  function handleResourceDetail(order: Order) {
    setSelectedOrder(order)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">订单列表</h1>
        <p className="text-sm text-[#969696] mt-1">
          交易中心 · 线下履约与资源池发起订单的汇总视图。
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#969696]" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="企业/订单号/商品关键词"
            className="h-9 border-[#e9ebec] bg-white pl-9 text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">企业名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">订单号</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">标题</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">订单状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品规格</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">购买数量</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">金额</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">资源</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">客户参考(SAP)</TableHead>
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
                <TableCell colSpan={11} className="text-center text-[#969696] py-8">
                  暂无订单
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((o, i) => {
                const globalIndex = (safePage - 1) * pageSize + i
                const striped = globalIndex % 2 === 1
                return (
                  <TableRow key={o.no} className={cn(
                    'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                    striped && 'bg-[rgba(233,235,236,0.2)]'
                  )}>
                    <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{o.customer || '—'}</TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{o.no}</TableCell>
                    <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232] max-w-[200px] truncate">{o.title || '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={`inline-flex h-6 items-center rounded-lg px-2 text-[14px] leading-[22px] ${orderStatusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{o.product || '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{o.spec || '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{o.quantity ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{o.amount || '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => handleResourceDetail(o)}
                      >
                        详情
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{o.sapRef || '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => navigate(`/admin/trade/detail?no=${encodeURIComponent(o.no)}`)}
                      >
                        详情
                      </button>
                    </TableCell>
                  </TableRow>
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

      <OrderResourceDrawer open={drawerOpen} onOpenChange={setDrawerOpen} order={selectedOrder} />
    </div>
  )
}
