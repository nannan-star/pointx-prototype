import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export interface RenewTarget {
  company: string
  instance: string
  product: string
  spec: string
  serviceNodes: string[]
  isDefault: boolean
}

interface RenewResourceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: RenewTarget | null
}

export function RenewResourceDrawer({ open, onOpenChange, target }: RenewResourceDrawerProps) {
  const [qty, setQty] = useState('100')
  const [remark, setRemark] = useState('')

  const handleSubmit = () => {
    const qtyNum = parseInt(qty, 10)
    if (!qtyNum || qtyNum < 1 || isNaN(qtyNum)) {
      alert('请输入有效的续费数量')
      return
    }
    alert('已创建续费订单（演示）')
    onOpenChange(false)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setQty('100')
      setRemark('')
    }
    onOpenChange(val)
  }

  if (!target) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[420px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="border-b border-[#e9ebec] px-5 py-4">
          <SheetTitle className="text-base font-semibold text-[#1a1a1a]">资源续费</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5">
            {/* Readonly target section */}
            <div className="rounded-lg border border-[#e9ebec] bg-[#f9fafb] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e9ebec] bg-[#f2f3f4] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#323232]">续费目标</span>
                  <span className="rounded bg-[#f0f2f5] border border-[#dce2e8] px-1.5 py-0.5 text-[10px] font-medium text-[#969696]">只读</span>
                </div>
              </div>
              <p className="px-4 pt-2 pb-1 text-xs text-[#969696]">以下维度来自当前列表行，不可在此修改；仅数量与备注可编辑。</p>
              <div className="flex flex-col divide-y divide-[#e9ebec]">
                {([
                  ['企业', target.company],
                  ['实例', target.instance],
                  ['商品', target.product],
                  ['规格', target.spec],
                  [
                    '服务节点',
                    target.serviceNodes.length > 0 ? target.serviceNodes.join('、') : '—',
                  ],
                  ['默认规格', target.isDefault ? '是' : '否'],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-[#969696]">{label}</span>
                    <span className="max-w-[220px] truncate text-sm font-medium text-[#323232]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#323232]">续费信息</span>
                <span className="rounded bg-[#e8f6ec] px-1.5 py-0.5 text-[10px] font-medium text-[#117a35]">可编辑</span>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 续费数量
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Input
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="例如：客户追加采购"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#c5c5c5]"
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-5 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-4 text-sm text-[#323232] hover:bg-[#dcdfe1]"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-4 text-sm text-white hover:bg-[#e8722d]"
          >
            确认续费
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
