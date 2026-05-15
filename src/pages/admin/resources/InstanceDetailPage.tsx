import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  instances,
  resourcePools,
  boundPackagesByInstance,
  type BoundPackageDetail,
} from '@/data/instance-mock'
import { cn } from '@/lib/utils'

const availablePackages = ['全球定位增强标准包', '星基融合旗舰包', '地基差分增强包']


function maskSecret(value: string): string {
  if (value.length <= 10) return '••••••••'
  return `${value.slice(0, 9)}******${value.slice(-2)}`
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-[3px] shrink-0 rounded-[2px] bg-[#ff7f32]" aria-hidden />
        <h2 className="text-[15px] font-semibold text-[#323232]">{title}</h2>
      </div>
      {subtitle ? <p className="ml-[11px] text-xs leading-normal text-[#969696]">{subtitle}</p> : null}
    </div>
  )
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-xs text-[#969696]">{label}</p>
      <div className="text-sm font-medium text-[#323232]">{children}</div>
    </div>
  )
}

export default function InstanceDetailPage() {
  const [searchParams] = useSearchParams()
  const instName = searchParams.get('name') || ''
  const inst = instances.find((i) => i.name === instName)
  const [editOpen, setEditOpen] = useState(false)
  const [copiedHint, setCopiedHint] = useState<string | null>(null)
  const [showSk, setShowSk] = useState(false)
  const [showSis, setShowSis] = useState(false)
  const [editSelectedPkgs, setEditSelectedPkgs] = useState<string[]>([])
  const [editAutoStock, setEditAutoStock] = useState('是')
  const [editActivateMode, setEditActivateMode] = useState('')
  const [editAccountPrefix, setEditAccountPrefix] = useState('')
  const [editPkgPopoverOpen, setEditPkgPopoverOpen] = useState(false)

  const boundList = useMemo(
    () => boundPackagesByInstance[inst?.name ?? ''] ?? [],
    [inst?.name]
  )

  const [expandedPkg, setExpandedPkg] = useState<boolean[]>(() =>
    boundList.map((_, i) => i === 0)
  )

  useEffect(() => {
    if (!instName) return
    const list = boundPackagesByInstance[instName] ?? []
    setExpandedPkg(list.map((_, i) => i === 0))
  }, [instName])

  const showCopied = useCallback((msg: string) => {
    setCopiedHint(msg)
    window.setTimeout(() => setCopiedHint(null), 2200)
  }, [])

  const copyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showCopied(`${label}已复制到剪贴板`)
      } catch {
        showCopied('复制失败，请手动选择文本')
      }
    },
    [showCopied]
  )

  if (!inst) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/instances"
          className="text-sm text-[#ff7f32] underline-offset-2 hover:underline"
        >
          ← 返回实例列表
        </Link>
        <p className="text-sm text-[#969696]">未找到实例「{instName || '（未指定）'}」。</p>
      </div>
    )
  }

  const hasPackage = inst.packageNames.length > 0
  const entId = resourcePools.find((p) => p.instance === inst.name)?.enterpriseId || '—'
  const running = hasPackage

  function togglePkg(i: number) {
    setExpandedPkg((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  function expandAllPkgs() {
    setExpandedPkg(boundList.map(() => true))
  }

  function tierBadge(tier: BoundPackageDetail['tier']) {
    if (tier === 'standard') {
      return (
        <span className="inline-flex shrink-0 items-center rounded border border-[#c5d8fb] bg-[#e9f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1e4fc7]">
          标准
        </span>
      )
    }
    return (
      <span className="inline-flex shrink-0 items-center rounded border border-[#d7befa] bg-[#f3ebfe] px-2 py-0.5 text-[11px] font-semibold text-[#7c3aed]">
        旗舰
      </span>
    )
  }

  function removeEditPkg(pkg: string) {
    setEditSelectedPkgs((prev) => prev.filter((p) => p !== pkg))
  }

  return (
    <div className="flex flex-col gap-5">
      {copiedHint ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[#e9ebec] bg-white px-4 py-2 text-sm text-[#323232] shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.12)]"
        >
          {copiedHint}
        </div>
      ) : null}

      <Link
        to="/admin/instances"
        className="text-sm text-[#ff7f32] underline-offset-2 hover:underline"
      >
        ← 返回实例列表
      </Link>

      {/* 页头 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold leading-none text-[#323232]">{inst.name}</h1>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-0.5 text-xs font-semibold',
                running
                  ? 'border-[#b7e4c1] bg-[#e8f6ec] text-[#117a35]'
                  : 'border-[#ffd4b3] bg-[#fff3e5] text-[#ff7f32]'
              )}
            >
              {running ? (
                <>
                  <span className="size-1.5 shrink-0 rounded-full bg-[#117a35]" aria-hidden />
                  运行中
                </>
              ) : (
                <>待配置</>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded border border-[#e9ebec] bg-[#f5f6f7] px-2.5 py-1 text-xs text-[#666]">
              企业&nbsp;&nbsp;{inst.company}
            </span>
            <span className="inline-flex rounded border border-[#e9ebec] bg-[#f5f6f7] px-2.5 py-1 text-xs text-[#666]">
              公司 ID&nbsp;&nbsp;{entId}
            </span>
            {hasPackage ? (
              <span className="inline-flex rounded border border-[#b7e4c1] bg-[#e8f6ec] px-2.5 py-1 text-xs text-[#117a35]">
                SDK 套餐已配置
              </span>
            ) : (
              <span className="inline-flex rounded border border-[#ffd4b3] bg-[#fff3e5] px-2.5 py-1 text-xs text-[#ff7f32]">
                SDK 套餐未配置
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg border-[#e9ebec] bg-white px-3.5 text-[13px] font-normal text-[#323232] hover:bg-[#f9f9f9]"
              >
                更多
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] border-[#e9ebec]">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => void copyText(inst.name, '实例名称')}
              >
                复制实例名称
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/admin/pool">跳转资源池</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            className="h-9 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3.5 text-[13px] font-normal text-white hover:bg-[#ff6a14]"
            onClick={() => setEditOpen(true)}
          >
            编辑实例
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="rounded-lg border border-[#e9ebec] bg-white px-6 py-5 shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4">
          <SectionTitle title="基本信息" subtitle="企业、实例、履约参数" />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
              <FieldBlock label="企业名称">{inst.company}</FieldBlock>
              <FieldBlock label="公司 ID">{entId}</FieldBlock>
              <FieldBlock label="创建人">{inst.owner || '—'}</FieldBlock>
              <FieldBlock label="创建时间">{inst.createdAt || '—'}</FieldBlock>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
              <FieldBlock label="实例名称">{inst.name}</FieldBlock>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-xs text-[#969696]">SDK 套餐状态</p>
                <div>
                  {hasPackage ? (
                    <span className="inline-flex rounded border border-[#b7e4c1] bg-[#e8f6ec] px-2 py-0.5 text-xs font-semibold text-[#117a35]">
                      已配置
                    </span>
                  ) : (
                    <span className="inline-flex rounded border border-[#ffd4b3] bg-[#fff3e5] px-2 py-0.5 text-xs font-semibold text-[#ff7f32]">
                      未配置
                    </span>
                  )}
                </div>
              </div>
              <FieldBlock label="设备自动入库">{inst.deviceAutoStock || '—'}</FieldBlock>
              <FieldBlock label="激活方式">{inst.activateMode || '—'}</FieldBlock>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
              <FieldBlock label="账号前缀">{inst.accountPrefix || '—'}</FieldBlock>
              <FieldBlock label="绑定套餐">{inst.packageNames.join('、') || '—'}</FieldBlock>
              <div className="hidden flex-1 lg:block" aria-hidden />
              <div className="hidden flex-1 lg:block" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      {/* 接入凭证 */}
      <div className="rounded-lg border border-[#e9ebec] bg-white px-6 py-5 shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4">
          <SectionTitle
            title="接入凭证"
            subtitle="重置后旧密钥立即失效；明文仅在重置时展示一次。"
          />
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-md bg-[#f7f8f9] px-4 py-3">
                  <div className="w-[140px] shrink-0 space-y-0.5 whitespace-nowrap">
                    <p className="text-[13px] font-semibold text-[#323232]">应用标识 AK</p>
                    <p className="text-[11px] text-[#969696]">公钥 · 可用于客户端识别</p>
                  </div>
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-[#666]">
                    {inst.appKey || '—'}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded p-1 text-[#666] hover:bg-white/80 hover:text-[#323232]"
                    aria-label="复制 AK"
                    onClick={() => void copyText(inst.appKey || '', '应用标识 AK')}
                  >
                    <Copy className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-[#f7f8f9] px-4 py-3">
                  <div className="w-[140px] shrink-0 space-y-0.5 whitespace-nowrap">
                    <p className="text-[13px] font-semibold text-[#323232]">应用密钥 SK</p>
                    <p className="text-[11px] text-[#969696]">私钥 · 切勿泄露 · 仅重置时可见一次</p>
                  </div>
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-[#666]">
                    {showSk ? inst.appSecret : maskSecret(inst.appSecret)}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded p-1 text-[#666] hover:bg-white/80 hover:text-[#323232]"
                    aria-label={showSk ? '隐藏 SK' : '显示 SK'}
                    onClick={() => setShowSk((v) => !v)}
                  >
                    {showSk ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded p-1 text-[#666] hover:bg-white/80 hover:text-[#323232]"
                    aria-label="复制 SK"
                    onClick={() => void copyText(inst.appSecret, '应用密钥 SK')}
                  >
                    <Copy className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-md bg-[#f7f8f9] px-4 py-3">
                  <div className="w-[140px] shrink-0 space-y-0.5 whitespace-nowrap">
                    <p className="text-[13px] font-semibold text-[#323232]">实例标识 SIK</p>
                    <p className="text-[11px] text-[#969696]">实例唯一标识 · 随实例同生命周期</p>
                  </div>
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-[#666]">
                    {inst.sik || '—'}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded p-1 text-[#666] hover:bg-white/80 hover:text-[#323232]"
                    aria-label="复制 SIK"
                    onClick={() => void copyText(inst.sik || '', '实例标识 SIK')}
                  >
                    <Copy className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-[#f7f8f9] px-4 py-3">
                  <div className="w-[140px] shrink-0 space-y-0.5 whitespace-nowrap">
                    <p className="text-[13px] font-semibold text-[#323232]">实例密钥 SIS</p>
                    <p className="text-[11px] text-[#969696]">实例签名密钥 · 服务端签名校验</p>
                  </div>
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-[#666]">
                    {showSis ? inst.sis : maskSecret(inst.sis)}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded p-1 text-[#666] hover:bg-white/80 hover:text-[#323232]"
                    aria-label={showSis ? '隐藏 SIS' : '显示 SIS'}
                    onClick={() => setShowSis((v) => !v)}
                  >
                    {showSis ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded p-1 text-[#666] hover:bg-white/80 hover:text-[#323232]"
                    aria-label="复制 SIS"
                    onClick={() => void copyText(inst.sis, '实例密钥 SIS')}
                  >
                    <Copy className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* 绑定套餐明细 */}
      <div className="rounded-lg border border-[#e9ebec] bg-white px-6 py-5 shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-[3px] shrink-0 rounded-[2px] bg-[#ff7f32]" aria-hidden />
                  <h2 className="text-[15px] font-semibold text-[#323232]">绑定套餐明细</h2>
                </div>
                <span className="text-xs text-[#969696]">· {boundList.length} 个已绑定套餐</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md border-[#e9ebec] bg-white text-xs font-normal text-[#666] hover:bg-[#f9f9f9]"
                  disabled={boundList.length === 0}
                  onClick={expandAllPkgs}
                >
                  全部展开
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md border-[#e9ebec] bg-white text-xs font-normal text-[#666] hover:bg-[#f9f9f9]"
                  onClick={() => setEditOpen(true)}
                >
                  + 绑定套餐
                </Button>
              </div>
            </div>

            {boundList.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#e9ebec] bg-[#f9f9f9] px-4 py-8 text-center text-sm text-[#969696]">
                暂无绑定套餐，可点击「+ 绑定套餐」在编辑实例中完成配置（演示）。
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {boundList.map((pkg, i) => {
                  const open = expandedPkg[i] ?? false
                  return (
                    <div
                      key={`${pkg.name}-${i}`}
                      className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white"
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => togglePkg(i)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                        >
                          {open ? (
                            <ChevronDown className="size-4 shrink-0 text-[#666]" aria-hidden />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-[#666]" aria-hidden />
                          )}
                          {tierBadge(pkg.tier)}
                          <span className="truncate text-sm font-semibold text-[#323232]">{pkg.name}</span>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded border border-[#e9ebec] bg-white text-[#666] hover:bg-[#f9f9f9]"
                              aria-label="更多操作"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-[#e9ebec]">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => showCopied('解绑为演示操作，未实际修改数据')}
                            >
                              解绑套餐
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => void copyText(pkg.name, '套餐名称')}
                            >
                              复制套餐名称
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {open ? (
                        <>
                          <div className="h-px w-full bg-[#e9ebec]" />
                          <div className="px-6 py-4">
                            <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
                              <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <FieldBlock label="商品类型">{pkg.productType}</FieldBlock>
                                <FieldBlock label="服务节点">{pkg.serviceNode}</FieldBlock>
                                <FieldBlock label="坐标系">{pkg.coordSys}</FieldBlock>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <FieldBlock label="可用挂载点">
                                  <span className="font-mono text-sm">{pkg.mountPoint}</span>
                                </FieldBlock>
                                <FieldBlock label="端口">{pkg.port}</FieldBlock>
                                <FieldBlock label="最大在线数">{pkg.maxOnline}</FieldBlock>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <FieldBlock label="是否启用 TSL">{pkg.tsl}</FieldBlock>
                                <FieldBlock label="是否启用压缩">{pkg.compress}</FieldBlock>
                                <FieldBlock label="数据源">{pkg.dataSource}</FieldBlock>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <FieldBlock label="备注">{pkg.remark}</FieldBlock>
                                <FieldBlock label="更新人">{pkg.updatedBy}</FieldBlock>
                                <FieldBlock label="更新时间">{pkg.updatedAt}</FieldBlock>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>


      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0 flex flex-col">
          <SheetHeader className="border-b border-[#e9ebec] px-4 py-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">配置实例</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              {/* 企业名称 & 实例名称 */}
              <div className="rounded-lg border border-[#e9ebec] overflow-hidden">
                <div className="flex items-center h-9 border-b border-[#e9ebec]">
                  <span className="bg-[#e9ebec]/40 w-[88px] shrink-0 h-full flex items-center justify-center text-sm text-[#323232]">
                    企业名称
                  </span>
                  <span className="px-3 text-sm font-semibold text-[#323232] truncate">
                    {inst.company}
                  </span>
                </div>
                <div className="flex items-center h-9">
                  <span className="bg-[#e9ebec]/40 w-[88px] shrink-0 h-full flex items-center justify-center text-sm text-[#323232]">
                    实例名称
                  </span>
                  <span className="px-3 text-sm font-semibold text-[#323232] truncate">
                    {inst.name}
                  </span>
                </div>
              </div>

              {/* SDK 服务套餐 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> SDK 服务套餐
                </label>
                <Popover open={editPkgPopoverOpen} onOpenChange={setEditPkgPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative flex items-center min-h-[32px] w-full cursor-pointer rounded-lg border border-[#e9ebec] bg-white px-2 py-1 gap-1 flex-wrap">
                      {editSelectedPkgs.length === 0 && (
                        <span className="text-sm text-[#969696]">请选择</span>
                      )}
                      {editSelectedPkgs.map((pkg) => (
                        <span
                          key={pkg}
                          className="inline-flex items-center gap-1 rounded-md bg-[#fff3e5] px-2 py-0.5 text-xs text-[#ff7f32] whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pkg}
                          <button
                            type="button"
                            className="inline-flex items-center justify-center text-[#ff7f32] hover:text-[#e06520]"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeEditPkg(pkg)
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <ChevronDown className="ml-auto size-4 shrink-0 text-[#969696]" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                    {availablePackages.map((pkg) => (
                      <label
                        key={pkg}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f5f5f5] cursor-pointer"
                      >
                        <Checkbox
                          checked={editSelectedPkgs.includes(pkg)}
                          onCheckedChange={() => toggleEditPkg(pkg)}
                        />
                        <span className="text-sm text-[#323232]">{pkg}</span>
                      </label>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              {/* 设备自动入库 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 设备自动入库
                </label>
                <Select value={editAutoStock} onValueChange={setEditAutoStock}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="是">是</SelectItem>
                    <SelectItem value="否">否</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 激活方式 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 激活方式
                </label>
                <Select value={editActivateMode} onValueChange={setEditActivateMode}>
                  <SelectTrigger className="h-8 w-full rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232]">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="设备SN绑定">设备SN绑定</SelectItem>
                    <SelectItem value="手动激活">手动激活</SelectItem>
                    <SelectItem value="在线激活">在线激活</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 账号前缀 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-normal text-[#646464]">账号前缀</label>
                <Input
                  value={editAccountPrefix}
                  onChange={(e) => setEditAccountPrefix(e.target.value)}
                  placeholder="账号前缀为4位小写字母，无则留空"
                  className="h-8 rounded-lg border-[#e9ebec] bg-white text-sm placeholder:text-[#969696]"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]"
            >
              取消
            </Button>
            <Button
              onClick={() => setEditOpen(false)}
              className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
            >
              保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
