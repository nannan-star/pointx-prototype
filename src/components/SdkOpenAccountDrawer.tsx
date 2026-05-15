import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Download } from 'lucide-react'

interface SdkOpenAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isClientView?: boolean
}

export function SdkOpenAccountDrawer({ open, onOpenChange, isClientView = false }: SdkOpenAccountDrawerProps) {
  const [company, setCompany] = useState(isClientView ? '新加坡智联科技有限公司' : '')
  const [product, setProduct] = useState('')
  const [spec, setSpec] = useState('')
  const [snInputMode, setSnInputMode] = useState<'manual' | 'file'>('manual')
  const [snList, setSnList] = useState('')
  const [remark, setRemark] = useState('')

  const handleSubmit = () => {
    if (!company || !product || !spec || !snList.trim()) {
      alert('请填写必填项')
      return
    }
    alert('保存成功（演示）')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] flex flex-col p-0">
        <SheetHeader className="border-b border-[#e9ebec] px-4 py-4">
          <SheetTitle className="text-sm font-semibold text-[#323232]">开通账号</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* 企业名称 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 企业名称
              </Label>
              <Select value={company} onValueChange={setCompany} disabled={isClientView}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                  <SelectValue placeholder="请选择企业" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="新加坡智联科技有限公司">新加坡智联科技有限公司</SelectItem>
                  <SelectItem value="马来西亚通达有限公司">马来西亚通达有限公司</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 商品 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 商品
              </Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                  <SelectValue placeholder="请选择商品" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="导航 SDK 内置账号">导航 SDK 内置账号</SelectItem>
                  <SelectItem value="定位 SDK 外置账号">定位 SDK 外置账号</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 商品规格 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 商品规格
              </Label>
              <Select value={spec} onValueChange={setSpec}>
                <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                  <SelectValue placeholder="请选择规格" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="是">是</SelectItem>
                  <SelectItem value="否">否</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 绑定 SN */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-normal text-[#646464]">
                <span className="text-[#eb2e2e]">*</span> 绑定 SN
              </Label>

              <div className="flex items-center gap-2">
                {/* Tab 切换 */}
                <div className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-[#e9ebec] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setSnInputMode('manual')}
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      snInputMode === 'manual'
                        ? 'bg-[#ff7f32] text-[#f9f9f9]'
                        : 'text-[#323232] hover:bg-[#f9f9f9]'
                    }`}
                  >
                    手动录入
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnInputMode('file')}
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      snInputMode === 'file'
                        ? 'bg-[#ff7f32] text-[#f9f9f9]'
                        : 'text-[#323232] hover:bg-[#f9f9f9]'
                    }`}
                  >
                    文件导入
                  </button>
                </div>

                {snInputMode === 'file' && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-[#ff7f32]"
                  >
                    <Plus className="size-4" />
                    下载模版
                  </button>
                )}
              </div>

              {snInputMode === 'manual' ? (
                <Textarea
                  value={snList}
                  onChange={(e) => setSnList(e.target.value)}
                  placeholder="每行一个设备SN"
                  rows={5}
                  className="min-h-[120px] resize-y rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#e9ebec] bg-white p-6 text-sm">
                  <Download className="size-5 text-[#969696]" />
                  <span className="text-[#969696]">点击或拖拽文件到此区域上传</span>
                </div>
              )}
            </div>

            {/* 备注 */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal text-[#646464]">备注</Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入备注信息"
                rows={4}
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
