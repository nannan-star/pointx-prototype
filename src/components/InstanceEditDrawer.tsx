import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { instances } from '@/data/instance-mock'

const availablePackages = ['全球定位增强标准包', '星基融合旗舰包', '地基差分增强包']

interface InstanceEditDrawerProps {
  instanceName: string | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function InstanceEditDrawer({ instanceName, onOpenChange, onSaved }: InstanceEditDrawerProps) {
  const open = instanceName !== null
  const inst = instances.find((i) => i.name === instanceName)

  const [selectedPkgs, setSelectedPkgs] = useState<string[]>([])
  const [autoStock, setAutoStock] = useState('是')
  const [activateMode, setActivateMode] = useState('')
  const [accountPrefix, setAccountPrefix] = useState('')

  useEffect(() => {
    if (inst) {
      setSelectedPkgs(inst.packageNames)
      setAutoStock(inst.deviceAutoStock || '是')
      setActivateMode(inst.activateMode || '')
      setAccountPrefix(inst.accountPrefix || '')
    }
  }, [inst])

  function togglePkg(pkg: string) {
    setSelectedPkgs((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    )
  }

  function handleSave() {
    if (!activateMode) return
    onSaved()
  }

  if (!inst) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
        <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
          <SheetTitle className="text-sm font-semibold text-[#323232]">编辑实例 · {inst.name}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-[18px]">
            {/* SDK 服务套餐 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">SDK 服务套餐</Label>
              <div className="space-y-2 rounded-lg border border-[#e9ebec] p-3">
                {availablePackages.map((pkg) => (
                  <div key={pkg} className="flex items-center gap-2">
                    <Checkbox
                      id={`pkg-${pkg}`}
                      checked={selectedPkgs.includes(pkg)}
                      onCheckedChange={() => togglePkg(pkg)}
                    />
                    <Label htmlFor={`pkg-${pkg}`} className="text-sm font-normal text-[#323232] cursor-pointer">
                      {pkg}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 设备自动入库
              </Label>
              <Select value={autoStock} onValueChange={setAutoStock}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="是">是</SelectItem>
                  <SelectItem value="否">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 激活方式
              </Label>
              <Select value={activateMode} onValueChange={setActivateMode}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="设备SN绑定">设备SN绑定</SelectItem>
                  <SelectItem value="手动激活">手动激活</SelectItem>
                  <SelectItem value="在线激活">在线激活</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">帐号前缀</Label>
              <Input
                value={accountPrefix}
                onChange={(e) => setAccountPrefix(e.target.value)}
                placeholder="可选"
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
            onClick={handleSave}
            className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
          >
            保存
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
