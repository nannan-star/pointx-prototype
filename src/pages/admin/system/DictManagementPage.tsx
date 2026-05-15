import { useState, useMemo, useEffect } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchFilterBar, type FilterValue } from '@/components/SearchFilterBar'
import { dictionaries, type Dictionary } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'enumType', label: '枚举类型', type: 'text' as const, placeholder: '请输入枚举类型' },
  { key: 'value', label: '值', type: 'text' as const, placeholder: '请输入值' },
]

const FILTER_FIELDS = [
  { key: 'enumType', label: '枚举类型', type: 'text' as const, placeholder: '请输入枚举类型' },
  { key: 'value', label: '值', type: 'text' as const, placeholder: '请输入值' },
  { key: 'description', label: '描述', type: 'text' as const, placeholder: '请输入描述' },
]

/* ---- Filter helpers ---- */
function cellString(r: Dictionary, key: string): string {
  const v = (r as unknown as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : ''
}

function matchField(value: FilterValue, cellStr: string): boolean {
  if (typeof value === 'string') {
    return cellStr.toLowerCase().includes(value.trim().toLowerCase())
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return true
    return value.some((v) => cellStr.toLowerCase().includes(v.toLowerCase()))
  }
  return true
}

export default function DictManagementPage() {
  const [items, setItems] = useState<Dictionary[]>(() =>
    [...dictionaries].sort((a, b) => {
      const tc = a.enumType.localeCompare(b.enumType, undefined, { sensitivity: 'base' })
      if (tc !== 0) return tc
      return a.sort - b.sort
    })
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editItem, setEditItem] = useState<Dictionary | null>(null)
  const [appliedSearchField, setAppliedSearchField] = useState('enumType')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState({ enumType: '', pk: '', value: '', sort: '', description: '' })

  const hasActiveFilters = useMemo(() => {
    return FILTER_FIELDS.some((f) => {
      const v = appliedFilters[f.key]
      if (Array.isArray(v)) return v.length > 0
      return typeof v === 'string' && v.trim() !== ''
    })
  }, [appliedFilters])

  const filtered = useMemo(() => {
    return items.filter((d) => {
      if (!matchField(appliedSearchValue, cellString(d, appliedSearchField))) return false
      for (const f of FILTER_FIELDS) {
        const v = appliedFilters[f.key]
        if (v === undefined) continue
        if (!matchField(v, cellString(d, f.key))) return false
      }
      return true
    })
  }, [items, appliedSearchField, appliedSearchValue, appliedFilters])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [appliedSearchValue, appliedSearchField, appliedFilters, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  function handleNew() {
    setEditItem(null)
    setForm({ enumType: '', pk: '', value: '', sort: '', description: '' })
    setDrawerOpen(true)
  }

  function handleEdit(item: Dictionary) {
    setEditItem(item)
    setForm({ enumType: item.enumType, pk: String(item.pk), value: item.value, sort: String(item.sort), description: item.description })
    setDrawerOpen(true)
  }

  function handleSave() {
    if (!form.enumType.trim() || !form.value.trim()) return
    if (editItem) {
      setItems(prev => prev.map(d =>
        d.id === editItem.id ? { ...d, enumType: form.enumType, pk: Number(form.pk) || 0, value: form.value, sort: Number(form.sort) || 0, description: form.description } : d
      ))
    } else {
      const newItem: Dictionary = {
        id: `dict-${Date.now()}`, enumType: form.enumType, pk: Number(form.pk) || 0,
        value: form.value, sort: Number(form.sort) || 0, description: form.description,
      }
      setItems(prev => [...prev, newItem])
    }
    setDrawerOpen(false)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">字典管理</h1>
      </div>

      <SearchFilterBar
        searchFields={SEARCH_FIELDS}
        filterFields={FILTER_FIELDS}
        hasActiveFilters={hasActiveFilters}
        onApply={({ searchField, searchValue, filters }) => {
          setAppliedSearchField(searchField)
          setAppliedSearchValue(searchValue)
          setAppliedFilters(filters)
        }}
        onReset={() => {
          setAppliedSearchField('enumType')
          setAppliedSearchValue('')
          setAppliedFilters({})
        }}
        actions={
          <Button
            onClick={handleNew}
            className="h-9 gap-1 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-4 text-sm font-normal text-white hover:bg-[#ff6a14]"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            新增
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">枚举类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">主键</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">值</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">排序</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">描述</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((d, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={d.id} className={cn(
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{d.enumType}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-[14px] leading-[22px] text-[#323232]">{d.pk}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{d.value}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-[14px] leading-[22px] text-[#323232]">{d.sort}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{d.description}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex h-6 min-w-[48px] items-center justify-center gap-1 rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                      onClick={() => handleEdit(d)}
                    >
                      编辑
                    </button>
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

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">{editItem ? '编辑字典' : '新增字典'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 枚举类型</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入枚举类型" value={form.enumType} onChange={e => setForm(f => ({ ...f, enumType: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">主键</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" type="number" placeholder="请输入主键" value={form.pk} onChange={e => setForm(f => ({ ...f, pk: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 值</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入值" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">排序</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" type="number" placeholder="请输入排序" value={form.sort} onChange={e => setForm(f => ({ ...f, sort: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">描述</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入描述" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <Button type="button" className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]" onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="button" className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]" onClick={handleSave}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
