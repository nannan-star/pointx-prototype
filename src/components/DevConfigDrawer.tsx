import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export interface ConfigTarget {
  company: string
  instance: string
  product: string
  spec: string
  isDefault: boolean
}

interface DevConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ConfigTarget | null
  onSave: (target: ConfigTarget, wantsDefault: boolean) => void
}

export function DevConfigDrawer({ open, onOpenChange, target, onSave }: DevConfigDrawerProps) {
  const [wantsDefault, setWantsDefault] = useState(false)

  useEffect(() => {
    if (open && target) {
      setWantsDefault(target.isDefault)
    }
  }, [open, target])

  const handleSubmit = () => {
    if (target) {
      onSave(target, wantsDefault)
      alert('已更新默认规格（演示）')
      onOpenChange(false)
    }
  }

  if (!target) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[420px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="border-b border-[#e9ebec] px-5 py-4">
          <SheetTitle className="text-base font-semibold text-[#1a1a1a]">开发者配置</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5">
            {/* Readonly context */}
            <div className="rounded-lg border border-[#e9ebec] bg-[#f9fafb] overflow-hidden">
              <div className="flex items-center border-b border-[#e9ebec] bg-[#f2f3f4] px-4 py-2.5">
                <span className="text-sm font-semibold text-[#323232]">当前配置项</span>
              </div>
              <div className="flex flex-col divide-y divide-[#e9ebec]">
                {([
                  ['企业', target.company],
                  ['实例', target.instance],
                  ['商品', target.product],
                  ['规格', target.spec],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-[#969696]">{label}</span>
                    <span className="max-w-[220px] truncate text-sm font-medium text-[#323232]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {target.isDefault && (
              <div className="flex items-center gap-1.5 rounded-lg border border-[#b7e4c1] bg-[#e8f6ec] px-3 py-2">
                <span className="size-[5px] rounded-full bg-[#117a35]" />
                <span className="text-xs font-medium text-[#117a35]">当前为默认规格</span>
              </div>
            )}

            {/* Editable: default spec checkbox */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#323232]">默认规格设置</span>
                <span className="rounded bg-[#e8f6ec] px-1.5 py-0.5 text-[10px] font-medium text-[#117a35]">可编辑</span>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-[#e9ebec] bg-white px-4 py-3">
                <Checkbox
                  id="pool-cfg-default"
                  checked={wantsDefault}
                  onCheckedChange={v => setWantsDefault(!!v)}
                  className="mt-0.5"
                />
                <Label htmlFor="pool-cfg-default" className="cursor-pointer text-sm leading-5 text-[#323232]">
                  设为该实例下该商品的<strong>默认规格</strong>
                </Label>
              </div>

              <p className="text-xs text-[#969696] leading-5">
                同一实例仅有一条默认规格；勾选保存后，同组其他规格会自动取消默认。
              </p>
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
            保存
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
