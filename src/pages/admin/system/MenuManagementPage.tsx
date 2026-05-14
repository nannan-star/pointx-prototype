import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
            <Button size="sm" className="h-9 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-white hover:bg-[#ff6a14]">新增</Button>
            <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={expandAll}>展开</Button>
            <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={collapseAll}>收起</Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">菜单名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">菜单类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">状态</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">显示顺序</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">路由地址</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">请求地址</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">权限 Key</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">默认显示</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
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
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">
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
                  <TableCell className="px-4 py-3 text-right">
                    <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer">
                      编辑
                    </button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
