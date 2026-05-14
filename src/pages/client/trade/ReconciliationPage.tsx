import { useState, useMemo, useEffect } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { reconciliationData } from '@/data/reconciliation-mock'
import { cn } from '@/lib/utils'

const months = ['2026-04', '2026-03', '2026-02']

export default function ReconciliationPage() {
  const [month, setMonth] = useState('2026-04')
  const [regionFilter, setRegionFilter] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return reconciliationData.filter(r => {
      if (r.month !== month) return false
      if (regionFilter && !r.region.includes(regionFilter)) return false
      if (specFilter && !r.spec.includes(specFilter)) return false
      return true
    })
  }, [month, regionFilter, specFilter])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  useEffect(() => { setPage(1) }, [month, regionFilter, specFilter, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  function handleExport() {
    alert('导出 Excel（演示）')
  }

  return (
    <div className="space-y-4 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <h1 className="text-xl font-semibold text-[#323232]">对账管理</h1>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[#323232]">对账月份</span>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-32 h-9 border-[#e9ebec] bg-white text-sm text-[#323232]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          className="w-32 h-9 border-[#e9ebec] bg-white text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
          placeholder="区域"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
        />
        <Input
          className="w-44 h-9 border-[#e9ebec] bg-white text-sm text-[#323232] placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25"
          placeholder="规格"
          value={specFilter}
          onChange={e => setSpecFilter(e.target.value)}
        />
        <Button size="sm" className="h-9 rounded-lg border-[#e9ebec] bg-white text-sm text-[#323232] hover:bg-[#f9f9f9]">应用筛选</Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={handleExport}
          className="h-8 shrink-0 gap-1 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm font-normal text-[#f9f9f9] hover:bg-[#ff6a14]"
        >
          导出 Excel
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <Table className="text-sm">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#e9ebec]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-10 rounded-tl-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">月份</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">区域</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">规格</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-right text-xs font-semibold text-[#323232]">激活数</TableHead>
              <TableHead className="h-10 bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">单价</TableHead>
              <TableHead className="h-10 rounded-tr-lg bg-[rgba(233,235,236,0.4)] px-4 text-xs font-semibold text-[#323232]">金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#969696]">暂无对账数据</TableCell>
              </TableRow>
            ) : pageRows.map((r, i) => {
              const globalIndex = (safePage - 1) * pageSize + i
              const striped = globalIndex % 2 === 1
              return (
                <TableRow key={`${r.month}-${r.region}-${r.spec}-${i}`} className={cn(
                  'border-b border-[#e9ebec] hover:bg-[rgba(233,235,236,0.12)] last:border-b-0',
                  striped && 'bg-[rgba(233,235,236,0.2)]'
                )}>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.month}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.region}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.spec}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-[14px] leading-[22px] text-[#323232]">{r.active}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.price}</TableCell>
                  <TableCell className="px-4 py-3 text-[14px] leading-[22px] text-[#323232]">{r.amount}</TableCell>
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
    </div>
  )
}
