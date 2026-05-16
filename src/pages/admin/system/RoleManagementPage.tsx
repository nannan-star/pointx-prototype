import { useState, useMemo, useEffect } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchFilterBar, type FilterValue } from '@/components/SearchFilterBar'
import { roles, type Role } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'name', label: '角色名称', type: 'text' as const, placeholder: '请输入角色名称' },
  { key: 'code', label: '角色标识', type: 'text' as const, placeholder: '请输入角色标识' },
]

const FILTER_FIELDS = [
  { key: 'name', label: '角色名称', type: 'text' as const, placeholder: '请输入角色名称' },
  { key: 'code', label: '角色标识', type: 'text' as const, placeholder: '请输入角色标识' },
]

/* ---- Filter helpers ---- */
function cellString(r: Role, key: string): string {
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

export default function RoleManagementPage() {
  const [roleList, setRoleList] = useState<Role[]>([...roles].sort((a, b) => a.sortOrder - b.sortOrder))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [appliedSearchField, setAppliedSearchField] = useState('name')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})
  const [form, setForm] = useState({ name: '', code: '', sortOrder: '', remark: '' })

  const hasActiveFilters = useMemo(() => {
    return FILTER_FIELDS.some((f) => {
      const v = appliedFilters[f.key]
      if (Array.isArray(v)) return v.length > 0
      return typeof v === 'string' && v.trim() !== ''
    })
  }, [appliedFilters])

  const filtered = useMemo(() => {
    return roleList.filter((r) => {
      if (!matchField(appliedSearchValue, cellString(r, appliedSearchField))) return false
      for (const f of FILTER_FIELDS) {
        const v = appliedFilters[f.key]
        if (v === undefined) continue
        if (!matchField(v, cellString(r, f.key))) return false
      }
      return true
    })
  }, [roleList, appliedSearchField, appliedSearchValue, appliedFilters])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * pageSize
  const slice = filtered.slice(start, start + pageSize)

  useEffect(() => { setPage(1) }, [appliedSearchValue, appliedSearchField, appliedFilters, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  function handleNew() {
    setEditRole(null)
    setForm({ name: '', code: '', sortOrder: '', remark: '' })
    setDrawerOpen(true)
  }

  function handleEdit(role: Role) {
    setEditRole(role)
    setForm({ name: role.name, code: role.code, sortOrder: String(role.sortOrder), remark: role.remark })
    setDrawerOpen(true)
  }

  function handleSave() {
    if (!form.name.trim() || !form.code.trim()) return
    if (editRole) {
      setRoleList(prev => prev.map(r =>
        r.code === editRole.code ? { ...r, name: form.name, sortOrder: Number(form.sortOrder) || 0, remark: form.remark } : r
      ))
    } else {
      const newRole: Role = {
        name: form.name, code: form.code, sortOrder: Number(form.sortOrder) || 0,
        remark: form.remark, createdAt: new Date().toLocaleString(),
      }
      setRoleList(prev => [...prev, newRole].sort((a, b) => a.sortOrder - b.sortOrder))
    }
    setDrawerOpen(false)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">角色权限</h1>
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
          setAppliedSearchField('name')
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
              <TableHead className="h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">角色名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">角色标识</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">显示顺序</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">备注</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">创建时间</TableHead>
              <TableHead className="h-10 sticky right-0 z-20 rounded-tr-lg bg-[#f2f3f4] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#969696]">暂无数据</TableCell>
              </TableRow>
            ) : slice.map((r, i) => {
              const globalIndex = start + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={r.code} className={cn(
                  'group border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232] sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>{r.name}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm text-[#323232]">{r.code}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-[14px] leading-[22px] text-[#323232]">{r.sortOrder}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.remark || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.createdAt}</TableCell>
                  <TableCell className={cn("px-4 py-3 text-right sticky right-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => handleEdit(r)}>编辑</button>
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer">菜单权限</button>
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer">数据权限</button>
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
                {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n} 条/页</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">{editRole ? '编辑角色' : '新增角色'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 角色名称</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入角色名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 角色标识</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入角色标识" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} disabled={!!editRole} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">显示顺序</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入显示顺序" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Textarea rows={3} className="rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入备注" value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <Button variant="ghost" className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]" onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]" onClick={handleSave}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
