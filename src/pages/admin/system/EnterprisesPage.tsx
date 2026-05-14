import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { enterprises, type Enterprise } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

function formatRoles(roles: string[]) {
  return roles.length > 0 ? roles.join('、') : '—'
}

export default function EnterprisesPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<Enterprise[]>(enterprises)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editEnt, setEditEnt] = useState<Enterprise | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState({ contact: '', name: '', phone: '', email: '', industry: '', remark: '' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.contact || '').toLowerCase().includes(q) ||
      e.phone.includes(q)
    )
  }, [list, query])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [query, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  function handleNew() {
    setEditEnt(null)
    setForm({ contact: '', name: '', phone: '', email: '', industry: '', remark: '' })
    setDrawerOpen(true)
  }

  function handleEdit(ent: Enterprise) {
    setEditEnt(ent)
    setForm({ contact: ent.contact, name: ent.name, phone: ent.phone, email: ent.email, industry: ent.industry, remark: ent.remark })
    setDrawerOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (editEnt) {
      setList(prev => prev.map(e => e.id === editEnt.id ? { ...e, ...form } : e))
    } else {
      const newEnt: Enterprise = {
        id: `ENT-${Date.now()}`, ...form, status: '正常',
        registeredAt: new Date().toLocaleString(), account: '',
        licenses: false, assignedRoles: ['企业管理员'],
      }
      setList(prev => [...prev, newEnt])
    }
    setDrawerOpen(false)
  }

  function handleToggleStatus(ent: Enterprise) {
    setList(prev => prev.map(e =>
      e.id === ent.id ? { ...e, status: e.status === '正常' ? '禁用' : '正常' } : e
    ))
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#323232]">企业用户</h1>
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
          placeholder="搜索企业名称/联系人/手机号"
          className="h-9 border-[#e9ebec] bg-white pl-9 text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">姓名</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">企业名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">手机号</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">邮箱</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">注册时间</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">角色</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">备注</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((e, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow
                  key={e.id}
                  className={cn(
                    'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0 cursor-pointer',
                    striped && 'bg-[rgba(233,235,236,0.2)]'
                  )}
                  onClick={() => navigate(`/admin/enterprises/${e.id}`)}
                >
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{e.contact}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{e.name}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`inline-flex h-6 items-center rounded-lg px-2 text-[14px] leading-[22px] ${e.status === '正常' ? 'bg-[#e9f7eb] text-[#35b85e]' : 'bg-red-50 text-red-500'}`}>
                      {e.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{e.phone}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{e.email}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{e.registeredAt}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{formatRoles(e.assignedRoles)}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{e.remark || ''}</TableCell>
                  <TableCell className="px-4 py-3 text-right" onClick={ev => ev.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => handleEdit(e)}
                      >
                        编辑
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                          >
                            更多
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStatus(e)}>
                            {e.status === '正常' ? '禁用' : '启用'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>重置密码</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editEnt ? '编辑企业' : '新增企业'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>企业名称 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>联系人</Label>
              <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>所属行业</Label>
              <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
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
