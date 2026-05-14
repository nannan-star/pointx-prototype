import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { roles, type Role } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function RoleManagementPage() {
  const [roleList, setRoleList] = useState<Role[]>([...roles].sort((a, b) => a.sortOrder - b.sortOrder))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ name: '', code: '', sortOrder: '', remark: '' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roleList
    return roleList.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q)
    )
  }, [roleList, query])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * pageSize
  const slice = filtered.slice(start, start + pageSize)

  useEffect(() => { setPage(1) }, [query, pageSize])
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#323232]">角色权限</h1>
        <Button
          onClick={handleNew}
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
          placeholder="搜索角色名称/标识"
          className="h-9 border-[#e9ebec] bg-white pl-9 text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">角色名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">角色标识</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">显示顺序</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">备注</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">创建时间</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
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
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.name}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm text-[#323232]">{r.code}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-[14px] leading-[22px] text-[#323232]">{r.sortOrder}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.remark || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.createdAt}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editRole ? '编辑角色' : '新增角色'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>角色名称 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>角色标识 *</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} disabled={!!editRole} />
            </div>
            <div className="space-y-2">
              <Label>显示顺序</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
