import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import type { CorsResource } from '@/data/resource-mock'

interface CorsDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: CorsResource
}

export function CorsDetailDrawer({ open, onOpenChange, resource }: CorsDetailDrawerProps) {
  if (!resource) return null

  const fields: Array<{ label: string; value: string }> = [
    { label: '企业名称', value: resource.company },
    { label: '账号名', value: resource.account },
    { label: '密码', value: resource.password },
    { label: '状态', value: resource.status },
    { label: '激活状态', value: resource.activateStatus },
    { label: '激活时间', value: resource.startAt || '—' },
    { label: '到期时间', value: resource.expireAt || '—' },
    { label: '剩余时间', value: resource.remaining },
    { label: '强制激活时间', value: resource.forceActivateAt || '—' },
    { label: '商品', value: resource.product },
    { label: '计费方式', value: resource.billingMode },
    { label: '平台登录', value: resource.platformLogin },
    { label: '剩余用量', value: resource.usageRemaining || '—' },
    { label: '负责人', value: resource.owner },
    { label: '区域', value: resource.region },
    { label: '规格', value: resource.spec },
    { label: '备注', value: resource.remark || '—' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>CORS 账号详情 · {resource.account}</SheetTitle>
        </SheetHeader>
        <dl className="mt-6 space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <dt className="text-gray-500">{f.label}</dt>
              <dd className="text-gray-900 break-all">{f.value}</dd>
            </div>
          ))}
        </dl>
      </SheetContent>
    </Sheet>
  )
}
