import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  serviceNodes as initialNodes,
  SERVICE_NODE_TYPE_OPTIONS,
  type ServiceNode,
} from '@/data/config-mock'
import { cn } from '@/lib/utils'
import { SearchFilterBar, type FilterFieldConfig, type FilterValue } from '@/components/SearchFilterBar'

const nodeSearchFields: FilterFieldConfig[] = [
  { key: 'name', label: '节点名称', type: 'text', placeholder: '请输入节点名称' },
  { key: 'type', label: '节点类型', type: 'text', placeholder: '请输入节点类型' },
  { key: 'code', label: '业务编号', type: 'text', placeholder: '请输入业务编号' },
]

const nodeFilterFields: FilterFieldConfig[] = [
  {
    key: 'type', label: '节点类型', type: 'select',
    options: SERVICE_NODE_TYPE_OPTIONS.map((t) => ({ label: t, value: t })),
  },
]

type DrawerMode = 'create' | 'edit' | 'detail' | null

export default function ServiceNodesPage() {
  const [nodes, setNodes] = useState<ServiceNode[]>(initialNodes)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [currentNode, setCurrentNode] = useState<ServiceNode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceNode | null>(null)
  const [searchField, setSearchField] = useState('name')
  const [searchValue, setSearchValue] = useState<FilterValue>('')
  const [filters, setFilters] = useState<Record<string, FilterValue>>({ type: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formEndpoint, setFormEndpoint] = useState('')
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
    setFilters({ type: [] })
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    const q = (typeof searchValue === 'string' ? searchValue : '').trim().toLowerCase()
    return nodes.filter((n) => {
      if (q) {
        const val = n[searchField as keyof ServiceNode] ?? ''
        if (!String(val).toLowerCase().includes(q)) return false
      }
      const typeFilter = filters.type as string[]
      if (typeFilter.length > 0 && !typeFilter.includes(n.type)) return false
      return true
    })
  }, [nodes, searchField, searchValue, filters])

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
    setFormName(''); setFormType(''); setFormCode(''); setFormEndpoint(''); setFormRemark('')
    setDrawerMode('create')
  }

  const openEdit = (node: ServiceNode) => {
    setCurrentNode(node)
    setFormName(node.name); setFormType(node.type); setFormCode(node.code)
    setFormEndpoint(node.endpoint); setFormRemark(node.remark)
    setDrawerMode('edit')
  }
  const openDetail = (node: ServiceNode) => {
    setCurrentNode(node)
    setDrawerMode('detail')
  }

  const handleSave = () => {
    if (!formName || !formType || !formCode || !formEndpoint) return
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
    if (drawerMode === 'create') {
      const newNode: ServiceNode = {
        name: formName, type: formType, code: formCode,
        endpoint: formEndpoint, remark: formRemark,
        referenced: false, createdBy: 'SuperAdmin', createdAt: ts,
        updatedBy: 'SuperAdmin', updatedAt: ts,
      }
      setNodes([...nodes, newNode])
    } else if (drawerMode === 'edit' && currentNode) {
      setNodes(nodes.map((n) =>
        n.code === currentNode.code
          ? { ...n, name: formName, type: formType, endpoint: formEndpoint, remark: formRemark, updatedBy: 'SuperAdmin', updatedAt: ts }
          : n
      ))
    }
    setDrawerMode(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setNodes(nodes.filter((n) => n.code !== deleteTarget.code))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#323232]">服务节点</h1>
      </div>

      <SearchFilterBar
        searchFields={nodeSearchFields}
        filterFields={nodeFilterFields}
        hasActiveFilters={hasActiveFilters}
        onApply={handleApply}
        onReset={handleReset}
        actions={
          <Button
            onClick={openCreate}
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
              <TableHead className="h-10 sticky left-0 z-20 rounded-tl-lg bg-[#f2f3f4] px-4 text-xs font-semibold text-[#323232]">节点名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">节点类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">业务编号</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">服务地址</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">创建人</TableHead>
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
            {pageRows.map((node, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={node.code} className={cn(
                  'group border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className={cn("px-4 py-3 text-[14px] leading-[22px] text-[#323232] sticky left-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>{node.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{node.type}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{node.code}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232] max-w-[200px] truncate">{node.endpoint}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{node.createdBy}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{node.createdAt}</TableCell>
                  <TableCell className={cn("px-4 py-3 text-right sticky right-0 z-10 bg-white group-hover:bg-[#fbfbfc]", striped && "bg-[#f8f9f9]")}>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => openEdit(node)}>编辑</button>
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs leading-5 text-red-500 transition-colors hover:bg-red-50 cursor-pointer" onClick={() => setDeleteTarget(node)}>删除</button>
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => openDetail(node)}>详情</button>
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">{drawerMode === 'create' ? '新增' : '编辑'}服务节点</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 节点名称</Label>
                <Input id="node-name" value={formName} onChange={(e) => setFormName(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 节点类型</Label>
                <Select value={formType} onValueChange={(v) => { setFormType(v); if (!formName) setFormName(v) }}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_NODE_TYPE_OPTIONS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 业务编号</Label>
                <Input id="node-code" value={formCode} onChange={(e) => setFormCode(e.target.value)} disabled={drawerMode === 'edit'} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 服务地址</Label>
                <Input id="node-endpoint" value={formEndpoint} onChange={(e) => setFormEndpoint(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Textarea id="node-remark" rows={4} value={formRemark} onChange={(e) => setFormRemark(e.target.value)} className="rounded-lg border-[#e9ebec] bg-white text-sm" />
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">节点详情</SheetTitle>
          </SheetHeader>
          {currentNode && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <dl className="flex flex-col gap-[18px] text-sm">
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">节点名称</dt><dd className="font-medium text-[#323232]">{currentNode.name}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">节点类型</dt><dd className="text-[#323232]">{currentNode.type}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">业务编号</dt><dd className="font-mono text-[#323232]">{currentNode.code}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">服务地址</dt><dd className="break-all text-[#323232]">{currentNode.endpoint}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">备注</dt><dd className="text-[#323232]">{currentNode.remark || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">创建人</dt><dd className="text-[#323232]">{currentNode.createdBy}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">创建时间</dt><dd className="text-[#323232]">{currentNode.createdAt}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新人</dt><dd className="text-[#323232]">{currentNode.updatedBy}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新时间</dt><dd className="text-[#323232]">{currentNode.updatedAt}</dd></div>
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.referenced
                ? `节点「${deleteTarget.name}」已被引用，删除后相关套餐将失去关联，确定删除？`
                : `确定删除节点「${deleteTarget?.name}」？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]">取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]">确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
