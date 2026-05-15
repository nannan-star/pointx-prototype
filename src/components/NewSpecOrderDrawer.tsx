import { useState, useMemo, useEffect } from 'react'
import { CircleHelp } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { enterprises } from '@/data/admin-system-mock'
import { products, specs } from '@/data/config-mock'
import { instances } from '@/data/instance-mock'

type ProductType = 'SDK' | 'CORS账号'

interface NewSpecOrderDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fixedCompany?: string
}

export function NewSpecOrderDrawer({ open, onOpenChange, fixedCompany }: NewSpecOrderDrawerProps) {
  const [company, setCompany] = useState(fixedCompany ?? (enterprises[0]?.name ?? ''))
  const [productType, setProductType] = useState<ProductType>('SDK')
  const [productName, setProductName] = useState(products[0]?.name ?? '')
  const [specId, setSpecId] = useState('')
  const [serviceNode, setServiceNode] = useState('')
  const [sdkQty, setSdkQty] = useState('10')
  const [corsQty, setCorsQty] = useState('10')
  const [sapRef, setSapRef] = useState('')
  const [remark, setRemark] = useState('')

  const filteredSpecs = useMemo(() => {
    return specs.filter(s => s.template === productName || s.product.includes(productName.replace('导航SDK内置账号', 'SDK内置账号')))
  }, [productName])

  const currentCompany = fixedCompany || company
  const instRow = useMemo(() => instances.find(i => i.company === currentCompany.trim()), [currentCompany])
  const availableNodes = useMemo(() => instRow?.serviceNodes ?? [], [instRow])

  useEffect(() => {
    setSpecId('')
  }, [filteredSpecs])

  useEffect(() => {
    setServiceNode('')
  }, [availableNodes])

  const handleProductChange = (val: string) => {
    setProductName(val)
    setSpecId('')
  }

  const handleSubmit = () => {
    const co = (fixedCompany || company).trim()
    if (!co) { alert('请选择企业名称'); return }
    if (!instRow) { alert('该客户下暂无实例，请先在实例模块创建'); return }
    if (!productName) { alert('请选择商品'); return }
    if (!specId) { alert('请选择商品规格'); return }
    if (!serviceNode) { alert('请选择服务节点'); return }

    if (productType === 'SDK') {
      const qty = parseInt(sdkQty, 10)
      if (!qty || qty < 1 || isNaN(qty)) { alert('请填写有效的数量'); return }
    } else {
      const pref = (instRow.accountPrefix || '').trim()
      if (!pref) { alert('该客户默认实例未配置帐号前缀，请在实例侧补全后再下 CORS 账号单'); return }
      const qty = parseInt(corsQty, 10)
      if (!qty || qty < 1 || isNaN(qty)) { alert('请填写有效的数量'); return }
    }

    const specRow = specs.find(s => s.id === specId)
    const specLabel = specRow ? `${specRow.product} · ${specRow.name}` : specId
    alert(`新规格下单已提交（演示）：${specLabel}`)
    onOpenChange(false)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setCompany(fixedCompany ?? (enterprises[0]?.name ?? ''))
      setProductType('SDK')
      setProductName(products[0]?.name ?? '')
      setSpecId('')
      setServiceNode('')
      setSdkQty('10')
      setCorsQty('10')
      setSapRef('')
      setRemark('')
    }
    onOpenChange(val)
  }

  const sectionTitle = fixedCompany ? '规格与数量' : '下单信息'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[420px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="border-b border-[#e9ebec] px-5 py-4">
          <SheetTitle className="text-base font-semibold text-[#1a1a1a]">新规格下单</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5">
            {/* Readonly company block */}
            {fixedCompany && (
              <div className="rounded-lg border border-[#e9ebec] bg-[#f9fafb] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#969696]">企业名称</span>
                  <span className="text-sm font-medium text-[#323232]">{fixedCompany}</span>
                </div>
              </div>
            )}

            {/* Editable section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#323232]">{sectionTitle}</span>
                <span className="rounded bg-[#e8f6ec] px-1.5 py-0.5 text-[10px] font-medium text-[#117a35]">可编辑</span>
              </div>

              {!fixedCompany && (
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-normal text-[#646464]">
                    <span className="text-[#eb2e2e]">*</span> 企业名称
                  </Label>
                  <Select value={company} onValueChange={setCompany}>
                    <SelectTrigger className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm">
                      <SelectValue placeholder="请选择企业" />
                    </SelectTrigger>
                    <SelectContent>
                      {enterprises.map(e => (
                        <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 商品类型
                </Label>
                <Select value={productType} onValueChange={v => setProductType(v as ProductType)}>
                  <SelectTrigger className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDK">SDK</SelectItem>
                    <SelectItem value="CORS账号">CORS账号</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 商品
                </Label>
                <Select value={productName} onValueChange={handleProductChange}>
                  <SelectTrigger className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm">
                    <SelectValue placeholder="请选择商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 商品规格
                </Label>
                <Select value={specId} onValueChange={setSpecId}>
                  <SelectTrigger className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm">
                    <SelectValue placeholder="请选择规格" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSpecs.length > 0 ? (
                      filteredSpecs.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.product} · {s.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__empty" disabled>该商品下暂无规格</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Label className="text-sm font-normal text-[#646464]">
                    <span className="text-[#eb2e2e]">*</span> 服务节点
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleHelp className="size-3.5 text-[#969696] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                        服务节点来源于该客户创建实例时选择的节点，只能从已有节点中选择一个作为本次下单的目标节点。
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={serviceNode} onValueChange={setServiceNode}>
                  <SelectTrigger className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm">
                    <SelectValue placeholder="请选择服务节点" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodes.length > 0 ? (
                      availableNodes.map(node => (
                        <SelectItem key={node} value={node}>{node}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__empty" disabled>该客户暂无可用服务节点</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {productType === 'SDK' ? (
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-normal text-[#646464]">
                    <span className="text-[#eb2e2e]">*</span> 数量
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={sdkQty}
                    onChange={e => setSdkQty(e.target.value)}
                    className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-normal text-[#646464]">
                    <span className="text-[#eb2e2e]">*</span> 数量
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={corsQty}
                    onChange={e => setCorsQty(e.target.value)}
                    className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">客户参考(SAP)</Label>
                <Input
                  value={sapRef}
                  onChange={e => setSapRef(e.target.value)}
                  placeholder="SAP 参考号或合同行"
                  className="h-8 w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#c5c5c5]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  rows={2}
                  placeholder="可选"
                  className="w-[300px] rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#c5c5c5] resize-none"
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
            提交下单
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
