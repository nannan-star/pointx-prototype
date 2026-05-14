import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { products as initialProducts, type Product } from '@/data/config-mock'
import { SearchFilterBar, type FilterFieldConfig, type FilterValue } from '@/components/SearchFilterBar'
import { cn } from '@/lib/utils'

const productSearchFields: FilterFieldConfig[] = [
  { key: 'name', label: '商品名称', type: 'text', placeholder: '请输入商品名称' },
  { key: 'type', label: '商品类型', type: 'text', placeholder: '请输入商品类型' },
  { key: 'id', label: '商品编码', type: 'text', placeholder: '请输入商品编码' },
]

const productFilterFields: FilterFieldConfig[] = [
  {
    key: 'type', label: '商品类型', type: 'select',
    options: [
      { label: 'SDK', value: 'SDK' },
      { label: '外置账号', value: '外置账号' },
      { label: '一键固定', value: '一键固定' },
    ],
  },
  {
    key: 'billingMode', label: '计费方式', type: 'select',
    options: [
      { label: '连续计费', value: '连续计费' },
      { label: '一次性', value: '一次性' },
    ],
  },
]

type DrawerMode = 'create' | 'edit' | 'detail' | null

export default function ProductsPage() {
  const [productList, setProductList] = useState<Product[]>(initialProducts)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [searchField, setSearchField] = useState('name')
  const [searchValue, setSearchValue] = useState<FilterValue>('')
  const [filters, setFilters] = useState<Record<string, FilterValue>>({ type: [], billingMode: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('SDK')
  const [formPrice, setFormPrice] = useState('')
  const [formBilling, setFormBilling] = useState('连续计费')
  const [formLine, setFormLine] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formRemark, setFormRemark] = useState('')

  const hasActiveFilters = useMemo(() =>
    Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : false)
  , [filters])

  const handleApply = useCallback((params: { searchField: string; searchValue: FilterValue; filters: Record<string, FilterValue> }) => {
    setSearchField(params.searchField)
    setSearchValue(params.searchValue)
    setFilters(params.filters)
    setPage(1)
  }, [])

  const handleReset = useCallback(() => {
    setSearchField('name')
    setSearchValue('')
    setFilters({ type: [], billingMode: [] })
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    const q = (typeof searchValue === 'string' ? searchValue : '').trim().toLowerCase()
    return productList.filter((p) => {
      if (q) {
        const val = p[searchField as keyof Product] ?? ''
        if (!String(val).toLowerCase().includes(q)) return false
      }
      const typeFilter = filters.type as string[]
      if (typeFilter.length > 0 && !typeFilter.includes(p.type)) return false
      const billingFilter = filters.billingMode as string[]
      if (billingFilter.length > 0 && !billingFilter.includes(p.billingMode)) return false
      return true
    })
  }, [productList, searchField, searchValue, filters])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const openCreate = () => {
    setFormName(''); setFormType('SDK'); setFormPrice('')
    setFormBilling('连续计费'); setFormLine(''); setFormRegion('')
    setFormSummary(''); setFormDesc(''); setFormRemark('')
    setDrawerMode('create')
  }

  const openEdit = (p: Product) => {
    setCurrentProduct(p)
    setFormName(p.name); setFormType(p.type); setFormPrice(p.price)
    setFormBilling(p.billingMode); setFormLine(p.line); setFormRegion(p.region)
    setFormSummary(p.summary); setFormDesc(p.description); setFormRemark(p.remark)
    setDrawerMode('edit')
  }
  const openDetail = (p: Product) => {
    setCurrentProduct(p)
    setDrawerMode('detail')
  }

  const handleSave = () => {
    if (!formName || !formPrice) return
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
    if (drawerMode === 'create') {
      const id = Math.random().toString(36).slice(2, 11).toUpperCase()
      const newProduct: Product = {
        id, name: formName, image: '', price: formPrice, type: formType,
        availablePackages: '', serviceCombos: [], billingMode: formBilling,
        productForm: 'standard', productLine: formLine, region: formRegion,
        summary: formSummary, description: formDesc, remark: formRemark,
        line: formLine, status: '上架', referenced: false,
        creatorEntries: [{ name: 'SuperAdmin', at: ts }],
        updatedBy: 'SuperAdmin', updatedAt: ts,
      }
      setProductList([...productList, newProduct])
    } else if (drawerMode === 'edit' && currentProduct) {
      setProductList(productList.map((p) =>
        p.id === currentProduct.id
          ? { ...p, name: formName, type: formType, price: formPrice, billingMode: formBilling, line: formLine, productLine: formLine, region: formRegion, summary: formSummary, description: formDesc, remark: formRemark, updatedBy: 'SuperAdmin', updatedAt: ts }
          : p
      ))
    }
    setDrawerMode(null)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#323232]">商品</h1>
        </div>
        <Button
          onClick={openCreate}
          className="h-8 shrink-0 gap-1 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-[#f9f9f9] hover:bg-[#ff6a14]"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          新增
        </Button>
      </div>

      <SearchFilterBar
        searchFields={productSearchFields}
        filterFields={productFilterFields}
        hasActiveFilters={hasActiveFilters}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品图片</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">价格</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">可用服务套餐</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">计费方式</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品编码</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((p, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={p.id} className={cn(
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{p.name}</TableCell>
                  <TableCell className="px-4 py-3">
                    {p.image ? <img src={p.image} alt={p.name} className="h-8 w-8 object-cover rounded" /> : <span className="text-[#969696]">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{p.type}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{p.price}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232] max-w-[180px] truncate">{p.availablePackages || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{p.billingMode}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{p.id}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => openEdit(p)}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => openDetail(p)}
                      >
                        详情
                      </button>
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">{drawerMode === 'create' ? '新增' : '编辑'}商品</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 商品名称</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 商品类型</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDK">SDK</SelectItem>
                    <SelectItem value="外置账号">外置账号</SelectItem>
                    <SelectItem value="一键固定">一键固定</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 价格</Label>
                <Input value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="¥0" className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">计费方式</Label>
                <Select value={formBilling} onValueChange={setFormBilling}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="连续计费">连续计费</SelectItem>
                    <SelectItem value="一次性">一次性</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">产品线</Label>
                <Input value={formLine} onChange={(e) => setFormLine(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">区域</Label>
                <Input value={formRegion} onChange={(e) => setFormRegion(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">简介</Label>
                <Input value={formSummary} onChange={(e) => setFormSummary(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">描述</Label>
                <Textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Textarea rows={2} value={formRemark} onChange={(e) => setFormRemark(e.target.value)} className="rounded-lg border-[#e9ebec] bg-white text-sm" />
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">商品详情</SheetTitle>
          </SheetHeader>
          {currentProduct && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <dl className="flex flex-col gap-[18px] text-sm">
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">商品名称</dt><dd className="font-medium text-[#323232]">{currentProduct.name}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">商品编码</dt><dd className="font-mono text-[#323232]">{currentProduct.id}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">商品类型</dt><dd className="text-[#323232]">{currentProduct.type}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">价格</dt><dd className="text-[#323232]">{currentProduct.price}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">计费方式</dt><dd className="text-[#323232]">{currentProduct.billingMode}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">产品线</dt><dd className="text-[#323232]">{currentProduct.line || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">区域</dt><dd className="text-[#323232]">{currentProduct.region || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">简介</dt><dd className="text-[#323232]">{currentProduct.summary || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">描述</dt><dd className="text-[#323232]">{currentProduct.description || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">可用服务套餐</dt><dd className="text-[#323232]">{currentProduct.availablePackages || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">备注</dt><dd className="text-[#323232]">{currentProduct.remark || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新人</dt><dd className="text-[#323232]">{currentProduct.updatedBy}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新时间</dt><dd className="text-[#323232]">{currentProduct.updatedAt}</dd></div>
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
