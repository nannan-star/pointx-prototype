import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import type { SdkResource } from '@/data/resource-mock'

interface SdkResourceDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: SdkResource
}

export function SdkResourceDetailDrawer({ open, onOpenChange, resource }: SdkResourceDetailDrawerProps) {
  if (!resource) return null

  const fields: Array<{ label: string; value: string }> = [
    { label: '企业名称', value: resource.company },
    { label: '实例名称', value: resource.instance },
    { label: '设备 ID/SN', value: resource.sn },
    { label: '设备类型', value: resource.deviceType },
    { label: '应用标识 AK', value: resource.ak },
    { label: '注册码', value: resource.regCode || '—' },
    { label: 'NTRIP 账号', value: resource.ntripAccount || '—' },
    { label: '激活状态', value: resource.activateStatus },
    { label: '服务状态', value: resource.status },
    { label: '激活方式', value: resource.activateMode },
    { label: '入库方式', value: resource.entryMode },
    { label: '计费方式', value: resource.billingMode },
    { label: '商品名称', value: resource.product },
    { label: '规格', value: resource.spec },
    { label: '激活时间', value: resource.activatedAt || '—' },
    { label: '到期时间', value: resource.expireAt || '—' },
    { label: '剩余时长', value: resource.remaining },
    { label: '区域', value: resource.region },
    { label: '业务线', value: resource.line },
    { label: '备注', value: resource.remark || '—' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>SDK 资源详情</SheetTitle>
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
