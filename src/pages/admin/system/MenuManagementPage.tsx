import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { SearchFilterBar, type FilterValue } from '@/components/SearchFilterBar'
import { menuTree, type MenuNode } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

/* ---- 搜索 / 筛选字段配置 ---- */
const SEARCH_FIELDS = [
  { key: 'name', label: '菜单名称', type: 'text' as const, placeholder: '请输入菜单名称' },
]

const FILTER_FIELDS = [
  { key: 'name', label: '菜单名称', type: 'text' as const, placeholder: '请输入菜单名称' },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '启用', value: '启用' },
    { label: '禁用', value: '禁用' },
  ] },
  { key: 'menuType', label: '菜单类型', type: 'select' as const, options: [
    { label: '目录', value: '目录' },
    { label: '菜单', value: '菜单' },
  ] },
]

interface FlatRow {
  node: MenuNode
  depth: number
  hasKids: boolean
}

function collectVisibleRows(nodes: MenuNode[], expanded: Record<string, boolean>, depth: number, out: FlatRow[]) {
  for (const n of nodes) {
    const hasKids = !!(n.children && n.children.length)
    out.push({ node: n, depth, hasKids })
    if (hasKids && expanded[n.id] !== false) {
      collectVisibleRows(n.children!, expanded, depth + 1, out)
    }
  }
}

export default function MenuManagementPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  /* drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editNode, setEditNode] = useState<MenuNode | null>(null)
  const [form, setForm] = useState({ name: '', menuType: '菜单', status: '启用', sortOrder: '', route: '', requestPath: '', permKey: '', defaultShow: '是' })

  function handleNew() {
    setEditNode(null)
    setForm({ name: '', menuType: '菜单', status: '启用', sortOrder: '', route: '', requestPath: '', permKey: '', defaultShow: '是' })
    setDrawerOpen(true)
  }

  function handleEdit(node: MenuNode) {
    setEditNode(node)
    setForm({
      name: node.name,
      menuType: node.menuType,
      status: node.status,
      sortOrder: String(node.sortOrder),
      route: node.route || '',
      requestPath: node.requestPath || '',
      permKey: node.permKey || '',
      defaultShow: node.defaultShow === true || node.defaultShow === '是' ? '是' : '否',
    })
    setDrawerOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    alert(editNode ? '编辑菜单成功（演示）' : '新增菜单成功（演示）')
    setDrawerOpen(false)
  }

  /* applied filter state */
  const [appliedSearchField, setAppliedSearchField] = useState('name')
  const [appliedSearchValue, setAppliedSearchValue] = useState<FilterValue>('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue>>({})

  function toggle(id: string) {
    setExpanded(prev => ({ ...prev, [id]: prev[id] === false ? true : false }))
  }

  function expandAll() {
    const all: Record<string, boolean> = {}
    function walk(nodes: MenuNode[]) {
      for (const n of nodes) {
        if (n.children?.length) { all[n.id] = true; walk(n.children) }
      }
    }
    walk(menuTree)
    setExpanded(all)
  }

  function collapseAll() {
    setExpanded({})
  }

  function cellString(n: MenuNode, key: string): string {
    const v = (n as unknown as Record<string, unknown>)[key]
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

  function nodeMatches(n: MenuNode): boolean {
    if (!matchField(appliedSearchValue, cellString(n, appliedSearchField))) return false
    for (const f of FILTER_FIELDS) {
      const v = appliedFilters[f.key]
      if (v === undefined) continue
      if (!matchField(v, cellString(n, f.key))) return false
    }
    return true
  }

  function filterTree(nodes: MenuNode[], out: FlatRow[], depth: number) {
    for (const n of nodes) {
      if (nodeMatches(n)) {
        const hasKids = !!(n.children?.length)
        out.push({ node: n, depth, hasKids })
        if (hasKids) filterTree(n.children!, out, depth + 1)
      } else if (n.children) {
        filterTree(n.children, out, depth)
      }
    }
  }

  const hasActive = appliedSearchValue !== '' && typeof appliedSearchValue === 'string' && (appliedSearchValue as string).trim() !== '' || FILTER_FIELDS.some((f) => {
    const v = appliedFilters[f.key]
    if (Array.isArray(v)) return v.length > 0
    return typeof v === 'string' && v.trim() !== ''
  })

  const rows: FlatRow[] = []
  if (hasActive) {
    filterTree(menuTree, rows, 0)
  } else {
    collectVisibleRows(menuTree, expanded, 0, rows)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <h1 className="text-xl font-semibold text-[#323232]">菜单管理</h1>

      <SearchFilterBar
        searchFields={SEARCH_FIELDS}
        filterFields={FILTER_FIELDS}
        hasActiveFilters={hasActive}
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
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-9 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-white hover:bg-[#ff6a14]" onClick={handleNew}>新增</Button>
            <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={expandAll}>展开</Button>
            <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={collapseAll}>收起</Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">菜单名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">菜单类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">显示顺序</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">路由地址</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">请求地址</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">权限 Key</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">默认显示</TableHead>
              <TableHead className="h-10 sticky right-0 z-20 rounded-tr-lg bg-[#f2f3f4] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-[#969696]">暂无菜单数据或未匹配筛选条件</TableCell>
              </TableRow>
            ) : rows.map((row, idx) => {
              const striped = idx % 2 === 1
              return (
                <TableRow key={row.node.id} className={cn(
                  'group border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232] sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
                    <div className="flex items-center gap-1" style={{ paddingLeft: row.depth * 20 }}>
                      {row.hasKids ? (
                        <button className="w-5 h-5 flex items-center justify-center text-xs border border-[#e9ebec] rounded bg-white hover:bg-[#f9f9f9] cursor-pointer" onClick={() => toggle(row.node.id)}>
                          {expanded[row.node.id] !== false ? '−' : '+'}
                        </button>
                      ) : <span className="w-5" />}
                      <span className={row.depth === 0 ? 'font-medium' : ''}>{row.node.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{row.node.menuType}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`inline-flex h-6 items-center rounded-lg px-2 text-[14px] leading-[22px] ${row.node.status === '启用' ? 'bg-[#e9f7eb] text-[#35b85e]' : 'bg-red-50 text-red-500'}`}>
                      {row.node.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-[14px] leading-[22px] text-[#323232]">{row.node.sortOrder}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{row.node.route || '—'}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-[#323232]">{row.node.requestPath || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-xs text-[#323232]">{row.node.permKey || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{row.node.defaultShow === true || row.node.defaultShow === '是' ? '是' : row.node.defaultShow === false || row.node.defaultShow === '否' ? '否' : '—'}</TableCell>
                  <TableCell className={cn("px-4 py-3 text-right sticky right-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
                    <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => handleEdit(row.node)}>
                      编辑
                    </button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">{editNode ? '编辑菜单' : '新增菜单'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 菜单名称
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="请输入菜单名称"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 菜单类型
                </Label>
                <Select value={form.menuType} onValueChange={(v) => setForm(f => ({ ...f, menuType: v }))}>
                  <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="目录">目录</SelectItem>
                    <SelectItem value="菜单">菜单</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 状态
                </Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="启用">启用</SelectItem>
                    <SelectItem value="禁用">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">显示顺序</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  placeholder="请输入显示顺序"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">路由地址</Label>
                <Input
                  value={form.route}
                  onChange={(e) => setForm(f => ({ ...f, route: e.target.value }))}
                  placeholder="请输入路由地址"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">请求地址</Label>
                <Input
                  value={form.requestPath}
                  onChange={(e) => setForm(f => ({ ...f, requestPath: e.target.value }))}
                  placeholder="请输入请求地址"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">权限 Key</Label>
                <Input
                  value={form.permKey}
                  onChange={(e) => setForm(f => ({ ...f, permKey: e.target.value }))}
                  placeholder="请输入权限标识"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">默认显示</Label>
                <Select value={form.defaultShow} onValueChange={(v) => setForm(f => ({ ...f, defaultShow: v }))}>
                  <SelectTrigger className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="是">是</SelectItem>
                    <SelectItem value="否">否</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <Button variant="outline" onClick={() => setDrawerOpen(false)} className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]">取消</Button>
            <Button onClick={handleSave} className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]">保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
