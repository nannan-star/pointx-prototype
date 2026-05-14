import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { specs as initialSpecs, products, type Spec } from '@/data/config-mock'
import { cn } from '@/lib/utils'

type DrawerMode = 'create' | 'edit' | 'detail' | null

export default function SpecsPage() {
  const [specList, setSpecList] = useState<Spec[]>(initialSpecs)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [currentSpec, setCurrentSpec] = useState<Spec | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formTemplate, setFormTemplate] = useState('')
  const [formPn, setFormPn] = useState('')
  const [formProduct, setFormProduct] = useState('')
  const [formName, setFormName] = useState('')
  const [formCurrency, setFormCurrency] = useState('CNY')
  const [formAgentPrice, setFormAgentPrice] = useState('')
  const [formTerminalPrice, setFormTerminalPrice] = useState('')
  const [formStock, setFormStock] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return specList
    return specList.filter((s) =>
      (s.template || '').toLowerCase().includes(q) ||
      s.pn.toLowerCase().includes(q) ||
      s.product.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
    )
  }, [specList, query])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [query, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const openCreate = () => {
    setFormTemplate(''); setFormPn(''); setFormProduct('')
    setFormName(''); setFormCurrency('CNY')
    setFormAgentPrice(''); setFormTerminalPrice(''); setFormStock('')
    setDrawerMode('create')
  }

  const openEdit = (s: Spec) => {
    setCurrentSpec(s)
    setFormTemplate(s.template); setFormPn(s.pn); setFormProduct(s.product)
    setFormName(s.name); setFormCurrency(s.currency)
    setFormAgentPrice(s.agentPrice); setFormTerminalPrice(s.terminalPrice)
    setFormStock(String(s.stock))
    setDrawerMode('edit')
  }
  const openDetail = (s: Spec) => {
    setCurrentSpec(s)
    setDrawerMode('detail')
  }

  const handleSave = () => {
    if (!formTemplate || !formPn || !formName) return
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
    if (drawerMode === 'create') {
      const id = Math.random().toString(36).slice(2, 15).toUpperCase()
      const newSpec: Spec = {
        id, pn: formPn, template: formTemplate, product: formProduct,
        name: formName, currency: formCurrency,
        agentPrice: formAgentPrice, terminalPrice: formTerminalPrice,
        stock: parseInt(formStock, 10) || 0, referenced: false,
        creatorEntries: [{ name: 'SuperAdmin', at: ts }],
        updatedBy: 'SuperAdmin', updatedAt: ts,
      }
      setSpecList([...specList, newSpec])
    } else if (drawerMode === 'edit' && currentSpec) {
      setSpecList(specList.map((s) =>
        s.id === currentSpec.id
          ? { ...s, template: formTemplate, pn: formPn, product: formProduct, name: formName, currency: formCurrency, agentPrice: formAgentPrice, terminalPrice: formTerminalPrice, stock: parseInt(formStock, 10) || 0, updatedBy: 'SuperAdmin', updatedAt: ts }
          : s
      ))
    }
    setDrawerMode(null)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#323232]">商品规格</h1>
        <Button
          onClick={openCreate}
          className="h-8 shrink-0 gap-1 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-[#f9f9f9] hover:bg-[#ff6a14]"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          新增
        </Button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#969696]" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索规格名称/PN号/商品"
          className="h-9 border-[#e9ebec] bg-white pl-9 text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">规格名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">PN号</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品规格</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">规格编码</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">币种</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">代理商价格</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">终端价格</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">库存</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((s, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={s.id} className={cn(
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{s.template || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{s.pn || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{s.product}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{s.name}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{s.id}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{s.currency || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-[14px] leading-[22px] text-[#323232]">{s.agentPrice || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-[14px] leading-[22px] text-[#323232]">{s.terminalPrice || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-[14px] leading-[22px] text-[#323232]">{s.stock}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => openEdit(s)}>编辑</button>
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => openDetail(s)}>详情</button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-[#e9ebec] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#969696]">共 {total} 条</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 border-[#e9ebec] bg-white text-[#323232] hover:bg-[#f9f9f9]" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
            <span className="text-sm text-[#323232]">{safePage} / {pageCount}</span>
            <Button type="button" variant="outline" size="sm" className="h-8 border-[#e9ebec] bg-white text-[#323232] hover:bg-[#f9f9f9]" disabled={safePage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>下一页</Button>
            <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[120px] border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="20">20 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Sheet open={drawerMode === 'create' || drawerMode === 'edit'} onOpenChange={() => setDrawerMode(null)}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">{drawerMode === 'create' ? '新增' : '编辑'}商品规格</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 规格名称</Label>
                <Input value={formTemplate} onChange={(e) => setFormTemplate(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> PN号</Label>
                <Input value={formPn} onChange={(e) => setFormPn(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">商品</Label>
                <Select value={formProduct} onValueChange={setFormProduct}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 商品规格</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">币种</Label>
                <Select value={formCurrency} onValueChange={setFormCurrency}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">代理商价格</Label>
                <Input value={formAgentPrice} onChange={(e) => setFormAgentPrice(e.target.value)} placeholder="¥0" className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">终端价格</Label>
                <Input value={formTerminalPrice} onChange={(e) => setFormTerminalPrice(e.target.value)} placeholder="¥0" className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">库存</Label>
                <Input type="number" min={0} value={formStock} onChange={(e) => setFormStock(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <Button
              variant="outline"
              onClick={() => setDrawerMode(null)}
              className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
            >
              确定
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={drawerMode === 'detail'} onOpenChange={() => setDrawerMode(null)}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">规格详情</SheetTitle>
          </SheetHeader>
          {currentSpec && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <dl className="flex flex-col gap-[18px] text-sm">
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">规格名称</dt><dd className="font-medium text-[#323232]">{currentSpec.template}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">PN号</dt><dd className="text-[#323232]">{currentSpec.pn}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">商品</dt><dd className="text-[#323232]">{currentSpec.product}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">商品规格</dt><dd className="text-[#323232]">{currentSpec.name}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">规格编码</dt><dd className="font-mono text-[#323232]">{currentSpec.id}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">币种</dt><dd className="text-[#323232]">{currentSpec.currency}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">代理商价格</dt><dd className="text-[#323232]">{currentSpec.agentPrice}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">终端价格</dt><dd className="text-[#323232]">{currentSpec.terminalPrice}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">库存</dt><dd className="text-[#323232]">{currentSpec.stock}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新人</dt><dd className="text-[#323232]">{currentSpec.updatedBy}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新时间</dt><dd className="text-[#323232]">{currentSpec.updatedAt}</dd></div>
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
