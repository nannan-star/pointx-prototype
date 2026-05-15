import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { StatusBadge } from '@/components/StatusBadge'
import type { SdkResource } from '@/data/resource-mock'

interface SdkResourceDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: SdkResource
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[#323232]">{title}</h3>
      <dl className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2">
        {children}
      </dl>
    </section>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  const display = typeof value === 'string'
    ? (value.trim() || '—')
    : value
  return (
    <>
      <dt className="text-sm text-[#969696]">{label}</dt>
      <dd className={`text-sm text-[#323232] break-all ${mono ? 'font-mono' : ''}`}>{display}</dd>
    </>
  )
}

export function SdkResourceDetailDrawer({ open, onOpenChange, resource }: SdkResourceDetailDrawerProps) {
  if (!resource) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="border-b border-[#e9ebec] px-4 py-4">
          <SheetTitle className="text-sm font-semibold text-[#323232]">SDK 资源详情</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Lead header */}
          <div className="mb-5 flex flex-col gap-1.5">
            <p className="text-base font-semibold text-[#323232]">{resource.regCode || '—'}</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-lg bg-[#f0f0f0] px-2 text-xs text-[#646464]">
                {resource.product || '—'}
              </span>
              <span className="text-sm text-[#969696]">{resource.instance || '—'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* 状态 */}
            <DetailSection title="状态">
              <DetailRow label="激活状态" value={<StatusBadge status={resource.activateStatus} variant="activate" />} />
              <DetailRow label="服务状态" value={<StatusBadge status={resource.status} variant="service" />} />
            </DetailSection>

            {/* 归属与客户 */}
            <DetailSection title="归属与客户">
              <DetailRow label="企业名称" value={resource.company} />
              <DetailRow label="实例名称" value={resource.instance} />
              <DetailRow label="应用标识 AK" value={resource.ak} mono />
            </DetailSection>

            {/* 设备与接入 */}
            <DetailSection title="设备与接入">
              <DetailRow label="设备 ID/SN" value={resource.sn} />
              <DetailRow label="设备类型" value={resource.deviceType} />
              <DetailRow label="Ntrip 账号" value={resource.ntripAccount} />
              <DetailRow label="激活方式" value={resource.activateMode} />
              <DetailRow label="入库方式" value={resource.entryMode} />
            </DetailSection>

            {/* 商品 */}
            <DetailSection title="商品">
              <DetailRow label="商品名称" value={resource.product} />
              <DetailRow label="规格" value={resource.spec} />
              <DetailRow label="计费方式" value={resource.billingMode} />
            </DetailSection>

            {/* 时间与周期 */}
            <DetailSection title="时间与周期">
              <DetailRow label="激活时间" value={resource.activatedAt} />
              <DetailRow label="到期时间" value={resource.expireAt} />
              <DetailRow label="剩余时长" value={resource.remaining} />
            </DetailSection>

            {/* 其他 */}
            <DetailSection title="其他">
              <DetailRow label="区域" value={resource.region} />
              <DetailRow label="业务线" value={resource.line} />
              <DetailRow label="备注" value={resource.remark} />
            </DetailSection>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
