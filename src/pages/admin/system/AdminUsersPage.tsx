import { useState, useMemo, useEffect } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchFilterBar, type FilterValue } from '@/components/SearchFilterBar'
import { adminUsers, roles, type AdminUser } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'name', label: '姓名', type: 'text' as const, placeholder: '请输入姓名' },
  { key: 'phone', label: '手机号', type: 'text' as const, placeholder: '请输入手机号' },
  { key: 'email', label: '邮箱', type: 'text' as const, placeholder: '请输入邮箱' },
]

const FILTER_FIELDS = [
  { key: 'name', label: '姓名', type: 'text' as const, placeholder: '请输入姓名' },
  { key: 'phone', label: '手机号', type: 'text' as const, placeholder: '请输入手机号' },
  { key: 'email', label: '邮箱', type: 'text' as const, placeholder: '请输入邮箱' },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '正常', value: '正常' },
    { label: '禁用', value: '禁用' },
  ] },
  { key: 'role', label: '角色', type: 'text' as const, placeholder: '请输入角色名称' },
]

/* ---- Filter helpers ---- */
function cellString(r: AdminUser, key: string): string {
  const v = (r as unknown as Record<string, unknown>)[key]
  if (key === 'role') return r.assignedRoles.length > 0 ? r.assignedRoles.join(',') : r.role
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(adminUsers)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: '', remark: '' })

  /* applied filter state */
  const [appliedSearchField, setAppliedSearchField] = useState('name')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const hasActiveFilters = useMemo(() => {
    return FILTER_FIELDS.some((f) => {
      const v = appliedFilters[f.key]
      if (Array.isArray(v)) return v.length > 0
      return typeof v === 'string' && v.trim() !== ''
    })
  }, [appliedFilters])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (!matchField(appliedSearchValue, cellString(u, appliedSearchField))) return false
      for (const f of FILTER_FIELDS) {
        const v = appliedFilters[f.key]
        if (v === undefined) continue
        if (!matchField(v, cellString(u, f.key))) return false
      }
      return true
    })
  }, [users, appliedSearchField, appliedSearchValue, appliedFilters])

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
    setEditUser(null)
    setForm({ name: '', phone: '', email: '', role: '', remark: '' })
    setDrawerOpen(true)
  }

  function handleEdit(user: AdminUser) {
    setEditUser(user)
    setForm({ name: user.name, phone: user.phone, email: user.email, role: user.assignedRoles[0] || '', remark: user.remark })
    setDrawerOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...form, assignedRoles: form.role ? [form.role] : u.assignedRoles } : u))
    } else {
      const newUser: AdminUser = {
        id: `ADM-${Date.now()}`,
        ...form,
        status: '正常',
        role: form.role || '普通管理员',
        assignedRoles: form.role ? [form.role] : ['普通管理员'],
        createdAt: new Date().toLocaleString(),
      }
      setUsers(prev => [...prev, newUser])
    }
    setDrawerOpen(false)
  }

  function handleToggleStatus(user: AdminUser) {
    setUsers(prev => prev.map(u =>
      u.id === user.id ? { ...u, status: u.status === '正常' ? '禁用' : '正常' } : u
    ))
  }

  function formatRoles(roles: string[], fallback: string) {
    const list = roles.length > 0 ? roles : [fallback]
    return list.join('、')
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">管理用户</h1>
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
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">姓名</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">手机号</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">邮箱</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">用户角色</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">创建时间</TableHead>
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
            {pageRows.map((u, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={u.id} className={cn(
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{u.name}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`inline-flex h-6 items-center rounded-lg px-2 text-[14px] leading-[22px] ${u.status === '正常' ? 'bg-[#e9f7eb] text-[#35b85e]' : 'bg-red-50 text-red-500'}`}>
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{u.phone}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{u.email}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{formatRoles(u.assignedRoles, u.role)}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{u.createdAt}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{u.remark || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer"
                        onClick={() => handleEdit(u)}
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
                          <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                            {u.status === '正常' ? '禁用' : '启用'}
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
          <p className="text-sm text-[#969696]">共 {total} 人</p>
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">{editUser ? '编辑用户' : '新增用户'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 姓名</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入姓名" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">手机号</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入手机号" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">邮箱</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入邮箱" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">角色</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Input className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" placeholder="请输入备注" value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <button type="button" className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]" onClick={() => setDrawerOpen(false)}>取消</button>
            <button type="button" className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]" onClick={handleSave}>保存</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
