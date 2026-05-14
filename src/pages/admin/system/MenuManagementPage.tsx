import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { menuTree, type MenuNode } from '@/data/admin-system-mock'
import { cn } from '@/lib/utils'

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
  const [filterName, setFilterName] = useState('')
  const [filterStatus, setFilterStatus] = useState('__all__')

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

  function matchesFilter(n: MenuNode): boolean {
    const nameOk = !filterName || n.name.includes(filterName)
    const statusOk = filterStatus === '__all__' || n.status === filterStatus
    return nameOk && statusOk
  }

  function filterTree(nodes: MenuNode[], out: FlatRow[], depth: number) {
    for (const n of nodes) {
      if (matchesFilter(n)) {
        const hasKids = !!(n.children?.length)
        out.push({ node: n, depth, hasKids })
        if (hasKids) filterTree(n.children!, out, depth + 1)
      } else if (n.children) {
        filterTree(n.children, out, depth)
      }
    }
  }

  const rows: FlatRow[] = []
  if (filterName || filterStatus !== '__all__') {
    filterTree(menuTree, rows, 0)
  } else {
    collectVisibleRows(menuTree, expanded, 0, rows)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <h1 className="text-xl font-semibold text-[#323232]">菜单管理</h1>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#969696]">菜单名称</span>
          <Input className="w-32 h-9 border-[#e9ebec] bg-white text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="请输入" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-24 h-9 border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue placeholder="全部" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部</SelectItem>
            <SelectItem value="启用">启用</SelectItem>
            <SelectItem value="禁用">禁用</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]">查询</Button>
        <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={() => { setFilterName(''); setFilterStatus('__all__') }}>重置</Button>
        <div className="flex-1" />
        <Button size="sm" className="h-9 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-[#f9f9f9] hover:bg-[#ff6a14]">新增</Button>
        <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={expandAll}>展开</Button>
        <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]" onClick={collapseAll}>收起</Button>
      </div>

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
