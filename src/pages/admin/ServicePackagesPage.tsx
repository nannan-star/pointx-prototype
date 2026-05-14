import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Settings2 } from 'lucide-react'
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
import { StatusBadge } from '@/components/StatusBadge'
import {
  servicePackages as initialPackages,
  serviceNodes,
  packagePortPresets,
  type ServicePackage,
  type PackagePortPreset,
} from '@/data/config-mock'
import { cn } from '@/lib/utils'

type DrawerMode = 'create' | 'edit' | 'detail' | null

export default function ServicePackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>(initialPackages)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [currentPkg, setCurrentPkg] = useState<ServicePackage | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formName, setFormName] = useState('')
  const [formNode, setFormNode] = useState('')
  const [formSpec, setFormSpec] = useState('SDK')
  const [formPresetIdx, setFormPresetIdx] = useState<string>('')
  const [formSources, setFormSources] = useState('')
  const [formMaxOnline, setFormMaxOnline] = useState('')
  const [formRemark, setFormRemark] = useState('')

  const filteredPresets = packagePortPresets.filter((p) => p.node === formNode)
  const selectedPreset: PackagePortPreset | null =
    formPresetIdx !== '' ? (filteredPresets[Number(formPresetIdx)] ?? null) : null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return packages
    return packages.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.node.toLowerCase().includes(q) ||
      p.spec.toLowerCase().includes(q)
    )
  }, [packages, query])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [query, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const openCreate = () => {
    setFormName(''); setFormNode(''); setFormSpec('SDK')
    setFormPresetIdx(''); setFormSources(''); setFormMaxOnline(''); setFormRemark('')
    setDrawerMode('create')
  }

  const openEdit = (pkg: ServicePackage) => {
    setCurrentPkg(pkg)
    setFormName(pkg.name); setFormNode(pkg.node); setFormSpec(pkg.spec)
    setFormPresetIdx(''); setFormSources(pkg.sources)
    setFormMaxOnline(String(pkg.maxOnline)); setFormRemark(pkg.remark)
    setDrawerMode('edit')
  }

  const openDetail = (pkg: ServicePackage) => {
    setCurrentPkg(pkg)
    setDrawerMode('detail')
  }

  const handleSave = () => {
    if (!formName || !formNode) return
    const maxVal = parseInt(formMaxOnline, 10)
    if (isNaN(maxVal) || maxVal < 1 || maxVal > 100000) return
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const base: ServicePackage = {
      name: formName, node: formNode, spec: formSpec,
      port: selectedPreset?.port ?? '', coord: selectedPreset?.coord ?? '—',
      mount: selectedPreset?.mount ?? '—', sources: formSources,
      maxOnline: maxVal, tslEnabled: selectedPreset?.tslEnabled ?? false,
      compressEnabled: selectedPreset?.compressEnabled ?? false,
      status: '启用', remark: formRemark, updatedBy: 'SuperAdmin', updatedAt: ts,
    }
    if (drawerMode === 'create') {
      setPackages([...packages, base])
    } else if (drawerMode === 'edit' && currentPkg) {
      setPackages(packages.map((p) => p.name === currentPkg.name ? { ...p, ...base } : p))
    }
    setDrawerMode(null)
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#323232]">服务套餐</h1>
        <Button
          onClick={openCreate}
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
          placeholder="搜索套餐名称/节点/商品类型"
          className="h-9 border-[#e9ebec] bg-white pl-9 text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">套餐名称</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">商品类型</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">服务节点</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">坐标系</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">可用挂载点</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">端口</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">最大在线数</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">启用TSL</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">启用压缩</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  操作
                  <Settings2 className="size-3.5 text-[#969696]" aria-hidden />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((pkg, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={pkg.name} className={cn(
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.spec}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.node}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.coord}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.mount}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-[14px] leading-[22px] text-[#323232]">{pkg.port || '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-[14px] leading-[22px] text-[#323232]">{pkg.maxOnline}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.tslEnabled ? '是' : '否'}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{pkg.compressEnabled ? '是' : '否'}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => openEdit(pkg)}>编辑</button>
                      <button type="button" className="inline-flex h-6 min-w-[48px] items-center justify-center rounded-lg border border-[#e9ebec] bg-white px-3 text-xs leading-5 text-[#323232] transition-colors hover:bg-[#f9f9f9] cursor-pointer" onClick={() => openDetail(pkg)}>详情</button>
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">{drawerMode === 'create' ? '新增' : '编辑'}服务套餐</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 套餐名称</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 服务节点</Label>
                <Select value={formNode} onValueChange={(v) => { setFormNode(v); setFormPresetIdx('') }}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {serviceNodes.map((n) => (<SelectItem key={n.code} value={n.name}>{n.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 商品类型</Label>
                <Select value={formSpec} onValueChange={setFormSpec}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDK">SDK</SelectItem>
                    <SelectItem value="CORS账号">CORS账号</SelectItem>
                    <SelectItem value="一键固定">一键固定</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 端口</Label>
                <Select value={formPresetIdx} onValueChange={setFormPresetIdx}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue placeholder="选择节点后可选" /></SelectTrigger>
                  <SelectContent>
                    {filteredPresets.map((p, i) => (
                      <SelectItem key={`${p.port}-${i}`} value={String(i)}>{p.label} ({p.port})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#969696]">选定后坐标系、挂载点、TLS 与压缩自动带出并置灰不可编辑。</p>
              </div>
              {selectedPreset && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#e9ebec] p-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-normal text-[#646464]">坐标系</Label>
                    <Input value={selectedPreset.coord} readOnly className="h-8 rounded-lg border-[#e9ebec] bg-[#f7f8f9] text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-normal text-[#646464]">可用挂载点</Label>
                    <Input value={selectedPreset.mount} readOnly className="h-8 rounded-lg border-[#e9ebec] bg-[#f7f8f9] text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-normal text-[#646464]">启用TSL</Label>
                    <Input value={selectedPreset.tslEnabled ? '是' : '否'} readOnly className="h-8 rounded-lg border-[#e9ebec] bg-[#f7f8f9] text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-normal text-[#646464]">启用压缩</Label>
                    <Input value={selectedPreset.compressEnabled ? '是' : '否'} readOnly className="h-8 rounded-lg border-[#e9ebec] bg-[#f7f8f9] text-sm" />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 源列表</Label>
                <Input value={formSources} onChange={(e) => setFormSources(e.target.value)} placeholder="按实际接入源填写" className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]"><span className="text-[#eb2e2e]">*</span> 最大在线数</Label>
                <Input type="number" min={1} max={100000} value={formMaxOnline} onChange={(e) => setFormMaxOnline(e.target.value)} placeholder="1–100000" className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">备注</Label>
                <Textarea rows={3} value={formRemark} onChange={(e) => setFormRemark(e.target.value)} className="rounded-lg border-[#e9ebec] bg-white text-sm" />
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
            <SheetTitle className="text-sm font-semibold text-[#323232]">套餐详情</SheetTitle>
          </SheetHeader>
          {currentPkg && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="font-medium text-[#323232]">{currentPkg.name}</span>
                <span className="text-xs bg-[rgba(233,235,236,0.4)] text-[#323232] px-2 py-0.5 rounded">{currentPkg.spec}</span>
                <span className="text-xs text-[#969696]">{currentPkg.node}</span>
                <StatusBadge status={currentPkg.status === '启用' ? '正常' : '停用'} />
              </div>
              <dl className="flex flex-col gap-[18px] text-sm">
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">坐标系</dt><dd className="text-[#323232]">{currentPkg.coord}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">可用挂载点</dt><dd className="text-[#323232]">{currentPkg.mount}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">端口</dt><dd className="font-mono text-[#323232]">{currentPkg.port || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">源列表</dt><dd className="text-[#323232]">{currentPkg.sources || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">最大在线数</dt><dd className="text-[#323232]">{currentPkg.maxOnline}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">启用 TSL</dt><dd className="text-[#323232]">{currentPkg.tslEnabled ? '是' : '否'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">启用压缩</dt><dd className="text-[#323232]">{currentPkg.compressEnabled ? '是' : '否'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">备注</dt><dd className="text-[#323232]">{currentPkg.remark || '—'}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新人</dt><dd className="text-[#323232]">{currentPkg.updatedBy}</dd></div>
                <div className="flex flex-col gap-1"><dt className="text-xs text-[#969696]">更新时间</dt><dd className="text-[#323232]">{currentPkg.updatedAt}</dd></div>
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
