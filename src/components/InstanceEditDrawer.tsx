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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { instances } from '@/data/instance-mock'
import { ChevronDown, X } from 'lucide-react'

const availablePackages = ['全球定位增强标准包', '星基融合旗舰包', '地基差分增强包']
const SERVICE_NODES = ['中国', '亚太', '南美', '日本', '北美', '欧洲', '土耳其'] as const

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
  const [resourceSharing, setResourceSharing] = useState('')
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [pkgPopoverOpen, setPkgPopoverOpen] = useState(false)
  const [nodePopoverOpen, setNodePopoverOpen] = useState(false)

  useEffect(() => {
    if (inst) {
      setSelectedPkgs(inst.packageNames)
      setAutoStock(inst.deviceAutoStock || '是')
      setActivateMode(inst.activateMode || '')
      setAccountPrefix(inst.accountPrefix || '')
      setResourceSharing(inst.resourceSharing || '')
      setSelectedNodes(inst.serviceNodes || [])
    }
  }, [inst])

  function togglePkg(pkg: string) {
    setSelectedPkgs((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    )
  }

  function removePkg(pkg: string) {
    setSelectedPkgs((prev) => prev.filter((p) => p !== pkg))
  }

  function toggleNode(node: string) {
    setSelectedNodes((prev) =>
      prev.includes(node) ? prev.filter((n) => n !== node) : [...prev, node]
    )
  }

  function handleSave() {
    if (!activateMode || selectedPkgs.length === 0) return
    onSaved()
  }

  if (!inst) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="border-b border-[#e9ebec] px-4 py-4 pb-3">
          <SheetTitle className="text-sm font-semibold text-[#323232]">配置实例</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-[18px]">
            {/* 企业名称 & 实例名称 */}
            <div className="rounded-lg border border-[#e9ebec] overflow-hidden">
              <div className="flex items-center h-9 border-b border-[#e9ebec]">
                <span className="bg-[#e9ebec]/40 w-[88px] shrink-0 h-full flex items-center justify-center text-sm text-[#323232]">
                  企业名称
                </span>
                <span className="px-3 text-sm font-semibold text-[#323232] truncate">
                  {inst.company}
                </span>
              </div>
              <div className="flex items-center h-9">
                <span className="bg-[#e9ebec]/40 w-[88px] shrink-0 h-full flex items-center justify-center text-sm text-[#323232]">
                  实例名称
                </span>
                <span className="px-3 text-sm font-semibold text-[#323232] truncate">
                  {inst.name}
                </span>
              </div>
            </div>

            {/* 资源共享情况 */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 资源共享情况
              </label>
              <Select value={resourceSharing} onValueChange={setResourceSharing}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
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
              <label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 服务节点
              </label>
              <Popover open={nodePopoverOpen} onOpenChange={setNodePopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="flex min-h-[32px] w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-[#e9ebec] bg-white px-2.5 py-1.5 transition-colors hover:border-[#ffa05c] focus-within:border-[#ff7f32] focus-within:ring-2 focus-within:ring-[#ff7f32]/20">
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
                  className="w-[--radix-popover-trigger-width] rounded-lg border border-[#e9ebec] p-1 shadow-lg"
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

            {/* SDK 服务套餐 */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> SDK 服务套餐
              </label>
              <Popover open={pkgPopoverOpen} onOpenChange={setPkgPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative flex items-center min-h-[32px] w-full cursor-pointer rounded-lg border border-[#e9ebec] bg-white px-2 py-1 gap-1 flex-wrap">
                    {selectedPkgs.length === 0 && (
                      <span className="text-sm text-[#969696]">请选择</span>
                    )}
                    {selectedPkgs.map((pkg) => (
                      <span
                        key={pkg}
                        className="inline-flex items-center gap-1 rounded-md bg-[#fff3e5] px-2 py-0.5 text-xs text-[#ff7f32] whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pkg}
                        <button
                          type="button"
                          className="inline-flex items-center justify-center text-[#ff7f32] hover:text-[#e06520]"
                          onClick={(e) => {
                            e.stopPropagation()
                            removePkg(pkg)
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <ChevronDown className="ml-auto size-4 shrink-0 text-[#969696]" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                  {availablePackages.map((pkg) => (
                    <label
                      key={pkg}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f5f5f5] cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPkgs.includes(pkg)}
                        onCheckedChange={() => togglePkg(pkg)}
                      />
                      <span className="text-sm text-[#323232]">{pkg}</span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* 设备自动入库 */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 设备自动入库
              </label>
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

            {/* 激活方式 */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 激活方式
              </label>
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

            {/* 账号前缀 */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-normal text-[#646464]">账号前缀</label>
              <Input
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
