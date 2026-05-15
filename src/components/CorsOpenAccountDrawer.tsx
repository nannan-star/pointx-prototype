import { useState, useMemo } from 'react'
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
import { enterprises } from '@/data/admin-system-mock'
import { products, specs } from '@/data/config-mock'
import { instances } from '@/data/instance-mock'

interface CorsOpenAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isClientView?: boolean
}

const CLIENT_COMPANY = '新加坡智联科技有限公司'

export function CorsOpenAccountDrawer({ open, onOpenChange, isClientView = false }: CorsOpenAccountDrawerProps) {
  const [company, setCompany] = useState(isClientView ? CLIENT_COMPANY : (enterprises[0]?.name ?? ''))
  const [productName, setProductName] = useState(products[0]?.name ?? '')
  const [specId, setSpecId] = useState('')
  const [qty, setQty] = useState('10')
  const [remark, setRemark] = useState('')

  const filteredSpecs = useMemo(() => {
    return specs.filter((s) => s.template === productName || s.product.includes(productName.replace('导航SDK内置账号', 'SDK内置账号')))
  }, [productName])

  const handleProductChange = (val: string) => {
    setProductName(val)
    setSpecId('')
  }

  const handleSubmit = () => {
    if (!company) {
      alert('请选择企业名称')
      return
    }
    const instRow = instances.find((i) => i.company === company)
    if (!instRow) {
      alert('该客户下暂无实例，请先在实例模块创建')
      return
    }
    const pref = (instRow.accountPrefix || '').trim()
    if (!pref) {
      alert('该客户默认实例未配置帐号前缀，请在实例侧补全后再开通 CORS 账号')
      return
    }
    if (!productName) {
      alert('请选择商品')
      return
    }
    if (!specId) {
      alert('请选择商品规格')
      return
    }
    const qtyNum = parseInt(qty, 10)
    if (!qtyNum || qtyNum < 1 || isNaN(qtyNum)) {
      alert('请填写有效的数量')
      return
    }
    alert('已提交开通（演示）')
    onOpenChange(false)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setCompany(isClientView ? CLIENT_COMPANY : (enterprises[0]?.name ?? ''))
      setProductName(products[0]?.name ?? '')
      setSpecId('')
      setQty('10')
      setRemark('')
    }
    onOpenChange(val)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
        <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
          <SheetTitle className="text-sm font-semibold text-[#323232]">开通账号</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 企业名称
              </Label>
              {isClientView ? (
                <Input
                  value={company}
                  disabled
                  className="h-8 rounded-lg border-[#e9ebec] bg-[#f5f5f5] text-sm text-[#969696]"
                />
              ) : (
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm">
                    <SelectValue placeholder="请选择企业" />
                  </SelectTrigger>
                  <SelectContent>
                    {enterprises.map((e) => (
                      <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {isClientView && (
                <p className="text-xs text-[#969696] mt-0.5">大客户视角下固定为当前登录企业。</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 商品
              </Label>
              <Select value={productName} onValueChange={handleProductChange}>
                <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm">
                  <SelectValue placeholder="请选择商品" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
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
                <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm">
                  <SelectValue placeholder="请选择规格" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSpecs.length > 0 ? (
                    filteredSpecs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.product} · {s.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty" disabled>该商品下暂无规格</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 数量
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
              />
              <p className="text-xs text-[#969696] mt-0.5">会查询该客户当前选中规格下面实际可用资源数量然后显示在这儿。</p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">备注</Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={2}
                placeholder="可选"
                className="rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696] resize-none"
              />
            </div>

            <p className="text-xs text-[#969696]">演示规则：账号名将使用该客户在实例模块配置的<strong className="font-medium">帐号前缀</strong>自动生成。</p>
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
          >
            提交
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
