import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SERVICE_NODES = ['中国', '亚太', '南美', '日本', '北美', '欧洲', '土耳其'] as const
type ServiceNode = (typeof SERVICE_NODES)[number]

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
  const [resourceSharing, setResourceSharing] = useState('')
  const [selectedNodes, setSelectedNodes] = useState<ServiceNode[]>([])
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
    setResourceSharing('')
    setSelectedNodes([])
    setAutoStock('是')
    setActivateMode('')
    setAccountPrefix('')
  }

  function toggleNode(node: ServiceNode) {
    setSelectedNodes((prev) =>
      prev.includes(node) ? prev.filter((n) => n !== node) : [...prev, node]
    )
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

            {/* 资源共享情况 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
              <span className="text-[#eb2e2e]">*</span>资源共享情况
              </Label>
              <Select value={resourceSharing} onValueChange={setResourceSharing}>
                <SelectTrigger
                  id="inst-resource-sharing"
                  className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"
                >
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全球分发">全球分发</SelectItem>
                  <SelectItem value="区域限定">区域限定</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 服务节点 - 多选下拉 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 服务节点
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex min-h-[32px] w-[300px] cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-[#e9ebec] bg-white px-2.5 py-1.5 transition-colors hover:border-[#ffa05c] focus-within:border-[#ff7f32] focus-within:ring-2 focus-within:ring-[#ff7f32]/20">
                    {selectedNodes.length === 0 && (
                      <span className="text-sm text-[#969696]">请选择</span>
                    )}
                    {selectedNodes.map((node) => (
                      <span
                        key={node}
                        className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-md bg-[#fff3e5] px-1.5 py-0.5 text-xs leading-5 text-[#ff7f32] transition-colors hover:bg-[#ffe8d5]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {node}
                        <button
                          type="button"
                          className="inline-flex size-4 items-center justify-center rounded-sm text-[#ff7f32] transition-colors hover:bg-[#ff7f32]/10 hover:text-[#e06520]"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleNode(node)
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <ChevronDown className="ml-auto size-4 shrink-0 text-[#969696] transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[300px] rounded-lg border border-[#e9ebec] p-1 shadow-lg"
                  align="start"
                  sideOffset={4}
                >
                  {SERVICE_NODES.map((node) => {
                    const checked = selectedNodes.includes(node)
                    return (
                      <label
                        key={node}
                        className={
                          'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ' +
                          (checked
                            ? 'bg-[#fff8f2] text-[#ff7f32]'
                            : 'text-[#323232] hover:bg-[#f5f5f5]')
                        }
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleNode(node)}
                          className="size-4 rounded border-[#dcdfe1] transition-colors data-[state=checked]:border-[#ff7f32] data-[state=checked]:bg-[#ff7f32]"
                        />
                        <span className="select-none">{node}</span>
                      </label>
                    )
                  })}
                </PopoverContent>
              </Popover>
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
