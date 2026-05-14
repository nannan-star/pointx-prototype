import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const enterprises = [
  '新加坡智联科技有限公司',
  '欧洲智联科技有限公司',
  '山东省智联测绘科技有限公司',
]

interface InstanceCreateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (name: string) => void
}

export function InstanceCreateDrawer({ open, onOpenChange, onCreated }: InstanceCreateDrawerProps) {
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [autoStock, setAutoStock] = useState('是')
  const [activateMode, setActivateMode] = useState('')
  const [accountPrefix, setAccountPrefix] = useState('')

  function handleSubmit() {
    if (!company) return
    if (!name.trim()) return
    if (!activateMode) return
    onCreated(name.trim())
    onOpenChange(false)
    resetForm()
  }

  function resetForm() {
    setCompany('')
    setName('')
    setAutoStock('是')
    setActivateMode('')
    setAccountPrefix('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
        <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
          <SheetTitle className="text-sm font-semibold text-[#323232]">新增实例</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-[18px]">
            {/* 企业名称 - 下拉选择 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 企业名称
              </Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger
                  id="inst-company"
                  className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"
                >
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {enterprises.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 实例名称 - 输入框 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 实例名称
              </Label>
              <Input
                id="inst-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入"
                maxLength={128}
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
            </div>

            {/* 设备自动入库 - 下拉选择 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 设备自动入库
              </Label>
              <Select value={autoStock} onValueChange={setAutoStock}>
                <SelectTrigger
                  id="inst-auto"
                  className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="是">是</SelectItem>
                  <SelectItem value="否">否</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 激活方式 - 下拉选择 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 激活方式
              </Label>
              <Select value={activateMode} onValueChange={setActivateMode}>
                <SelectTrigger
                  id="inst-act"
                  className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"
                >
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="设备SN绑定">设备 SN 绑定</SelectItem>
                  <SelectItem value="手动激活">手动激活</SelectItem>
                  <SelectItem value="在线激活">在线激活</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 帐号前缀 - 输入框 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">账号前缀</Label>
              <Input
                id="inst-prefix"
                value={accountPrefix}
                onChange={(e) => setAccountPrefix(e.target.value)}
                placeholder="账号前缀为4位小写字母，无则留空"
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
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
            新增
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
