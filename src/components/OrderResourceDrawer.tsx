import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Order } from '@/data/order-mock'

interface OrderResourceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

function pseudoResourceId(orderNo: string, rowIdx: number): string {
  let h = 2166136261 >>> 0
  const s = `${orderNo}#${rowIdx}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  let hex = (h >>> 0).toString(16)
  while (hex.length < 16) {
    h = Math.imul(h ^ rowIdx, 709607) >>> 0
    hex += (h >>> 0).toString(16)
  }
  return hex.slice(0, 16)
}

export function OrderResourceDrawer({ open, onOpenChange, order }: OrderResourceDrawerProps) {
  if (!order) return null

  const qty = typeof order.quantity === 'number' ? order.quantity : parseInt(String(order.quantity), 10)
  const n = Math.max(1, Math.min(!isNaN(qty) && qty > 0 ? qty : 5, 40))

  const rows = Array.from({ length: n }, (_, i) => {
    const idx = i + 1
    const rid = pseudoResourceId(order.no, idx)
    const acct = idx % 5 === 0 ? `ntrip_${rid.slice(0, 10)}` : ''
    return { idx, rid, acct }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto p-0">
        <SheetHeader className="border-b border-[#e9ebec] px-5 py-4">
          <SheetTitle className="text-base font-semibold text-[#1a1a1a]">资源明细</SheetTitle>
          <p className="text-xs text-[#969696] mt-0.5">
            订单号 <span className="font-mono text-[#323232]">{order.no}</span>
          </p>
        </SheetHeader>
        <div className="px-5 py-4 space-y-4">
          <div className="overflow-hidden rounded-lg border border-[#e9ebec]">
            <Table className="text-sm [&_tr]:border-[#e9ebec]">
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-9 w-14 bg-[#f2f3f4] px-3 text-xs font-semibold text-[#323232]">序号</TableHead>
                  <TableHead className="h-9 bg-[#f2f3f4] px-3 text-xs font-semibold text-[#323232]">资源</TableHead>
                  <TableHead className="h-9 bg-[#f2f3f4] px-3 text-xs font-semibold text-[#323232]">账号</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.idx} className={`border-b border-[#e9ebec] last:border-b-0 ${i % 2 === 1 ? 'bg-[rgba(233,235,236,0.2)]' : ''}`}>
                    <TableCell className="px-3 py-2.5 text-xs text-[#969696]">{r.idx}</TableCell>
                    <TableCell className="px-3 py-2.5 font-mono text-xs text-[#323232]">{r.rid}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-[#323232]">{r.acct || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="border-t border-[#e9ebec] px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-[#969696]">共 {n} 条</span>
          <span className="text-xs text-[#969696]">第 1 页 · {n} 条/页</span>
        </div>
      </SheetContent>
    </Sheet>
  )
}
