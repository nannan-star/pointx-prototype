import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CorsResource } from '@/data/resource-mock'

interface CorsEditDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: CorsResource
  onSave: (account: string, remark: string) => void
}

export function CorsEditDrawer({ open, onOpenChange, resource, onSave }: CorsEditDrawerProps) {
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (resource) {
      setRemark(resource.remark || '')
    }
  }, [resource])

  if (!resource) return null

  function handleSubmit() {
    onSave(resource!.account, remark.trim())
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] flex flex-col p-0">
        <SheetHeader className="border-b border-[#e9ebec] px-4 py-4">
          <SheetTitle className="text-sm font-semibold text-[#323232]">编辑 CORS 账号</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-[18px]">
            {/* 账号名 - 只读 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">账号名</Label>
              <div className="flex h-8 items-center rounded-lg border border-[#e9ebec] bg-[#f9f9f9] px-3">
                <span className="font-mono text-sm text-[#323232]">{resource.account}</span>
              </div>
            </div>

            {/* 备注 - 可编辑 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">备注</Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可选"
                rows={3}
                className="min-h-[80px] resize-y rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
          >
            保存
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
