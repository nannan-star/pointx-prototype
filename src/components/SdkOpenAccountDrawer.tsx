import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface SdkOpenAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isClientView?: boolean
}

export function SdkOpenAccountDrawer({ open, onOpenChange, isClientView = false }: SdkOpenAccountDrawerProps) {
  const [company, setCompany] = useState(isClientView ? '新加坡智联科技有限公司' : '')
  const [instance, setInstance] = useState('')
  const [sn, setSn] = useState('')
  const [deviceType, setDeviceType] = useState('')
  const [activateMode, setActivateMode] = useState('设备SN绑定')

  const handleSubmit = () => {
    if (!company || !sn) {
      alert('请填写必填项')
      return
    }
    alert('开通成功（演示）')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
        <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
          <SheetTitle className="text-sm font-semibold text-[#323232]">开通 SDK 账号</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 企业名称
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isClientView}
                placeholder="请输入企业名称"
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">实例名称</Label>
              <Input
                value={instance}
                onChange={(e) => setInstance(e.target.value)}
                placeholder="请输入实例"
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 设备 SN
              </Label>
              <Input
                value={sn}
                onChange={(e) => setSn(e.target.value)}
                placeholder="请输入设备 SN"
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">设备类型</Label>
              <Input
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                placeholder="请输入设备类型"
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">激活方式</Label>
              <Select value={activateMode} onValueChange={setActivateMode}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="设备SN绑定">设备SN绑定</SelectItem>
                  <SelectItem value="手动激活">手动激活</SelectItem>
                </SelectContent>
              </Select>
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
            确认开通
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
