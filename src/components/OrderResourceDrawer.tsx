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

/** 演示用资源 ID 生成（FNV-1a hash） */
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

/** 订单资源明细抽屉 */
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
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>资源明细</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            订单号 <span className="font-mono text-foreground">{order.no}</span> · 以下为演示资源明细
          </p>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">序号</TableHead>
                  <TableHead>资源</TableHead>
                  <TableHead>账号</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.idx}>
                    <TableCell className="text-muted-foreground">{r.idx}</TableCell>
                    <TableCell className="font-mono text-xs">{r.rid}</TableCell>
                    <TableCell>{r.acct || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>共 {n} 条</span>
            <span>第 1 页 · {n} 条/页</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
