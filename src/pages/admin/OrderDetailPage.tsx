import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { OrderResourceDrawer } from '@/components/OrderResourceDrawer'
import { ordersMock, type Order } from '@/data/order-mock'

/** 订单状态标签颜色 */
function orderStatusClass(status: string): string {
  if (status === '已支付' || status === '已付款' || status === '已完成') {
    return 'bg-green-100 text-green-700 border-green-200'
  }
  if (status === '待处理' || status === '待付款') {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

/** KV 描述项 */
function KvItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground w-28 shrink-0">{label}</dt>
      <dd className={`text-sm ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  )
}

/** 超管 · 订单详情页 */
export default function OrderDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const no = searchParams.get('no') || ''
  const order: Order | undefined = ordersMock.find((o) => o.no === no)

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/trade/orders')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回订单列表
        </Button>
        <h1 className="text-xl font-semibold">订单详情</h1>
        <p className="text-sm text-muted-foreground">
          请从<strong>订单列表</strong>选择一笔订单。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回 + 面包屑 */}
      <div className="space-y-1">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/trade/orders')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回订单列表
        </Button>
        <nav className="text-xs text-muted-foreground pl-1">
          <button className="hover:underline" onClick={() => navigate('/admin/trade/orders')}>
            订单列表
          </button>
          <span className="mx-1">/</span>
          <span className="font-mono">{order.no}</span>
        </nav>
      </div>

      {/* 概要卡片 */}
      <div className="border rounded-lg p-6 space-y-3">
        <p className="text-xs text-muted-foreground">订单详情</p>
        <h1 className="text-lg font-semibold">{order.title || '订单详情'}</h1>
        <p className="text-sm text-muted-foreground">
          超管侧 · 仅展示订单信息（演示，不调用真实支付）。
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">订单号</span>
          <span className="font-mono">{order.no}</span>
        </div>
        <div className="flex items-center gap-2">
          {order.product && (
            <Badge variant="secondary" className="text-xs">{order.product}</Badge>
          )}
          {order.amount && (
            <Badge variant="outline" className="text-xs text-muted-foreground">{order.amount}</Badge>
          )}
        </div>
        <div className="flex justify-end">
          <Badge variant="outline" className={`text-xs font-normal ${orderStatusClass(order.status)}`}>
            {order.status}
          </Badge>
        </div>
      </div>

      {/* 订单明细 */}
      <div className="border rounded-lg p-6 space-y-6">
        <h3 className="text-base font-semibold border-l-4 border-blue-500 pl-3">订单明细</h3>

        {/* 基本信息 */}
        <section className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">基本信息</h4>
          <dl>
            <KvItem label="企业名称" value={order.customer} />
            <KvItem label="订单状态" value={order.status} />
          </dl>
        </section>

        {/* 商品与资源 */}
        <section className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">商品与资源</h4>
          <dl>
            <KvItem label="商品" value={order.product} />
            <KvItem label="商品规格" value={order.spec} />
            <KvItem label="购买数量" value={String(order.quantity)} />
            <div className="flex items-start gap-2 py-1.5">
              <dt className="text-sm text-muted-foreground w-28 shrink-0">资源</dt>
              <dd>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setDrawerOpen(true)}
                >
                  详情
                </Button>
              </dd>
            </div>
            <KvItem label="客户参考(SAP)" value={order.sapRef} mono />
          </dl>
        </section>

        {/* 支付信息 */}
        <section className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">支付信息</h4>
          <dl>
            <KvItem label="订单金额" value={order.amount} />
            <KvItem label="支付时间" value={order.payAt} />
            <KvItem label="支付流水号" value={order.paySerial} mono />
          </dl>
        </section>

        {/* 记录与备注 */}
        <section className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">记录与备注</h4>
          <dl>
            <KvItem label="创建人" value={order.creator} />
            <KvItem label="创建时间" value={order.createdAt || order.payAt} />
            <KvItem label="更新人" value={order.updatedBy} />
            <KvItem label="更新时间" value={order.updatedAt} />
            <KvItem label="备注" value={order.remark} />
          </dl>
        </section>
      </div>

      <OrderResourceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        order={order}
      />
    </div>
  )
}
