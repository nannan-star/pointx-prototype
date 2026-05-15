import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Filter, CalendarIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FilterFieldType = 'text' | 'date' | 'select'

export interface SelectOption {
  label: string
  value: string
}

export interface FilterFieldConfig {
  key: string
  label: string
  type: FilterFieldType
  placeholder?: string
  options?: SelectOption[]
}

export type FilterValue = string | DateRange | string[]

export interface DateRange {
  from?: Date
  to?: Date
}

export interface SearchFilterBarProps {
  /** 快捷搜索可用的字段 */
  searchFields: FilterFieldConfig[]
  /** 组合筛选项（不传则不显示"所有筛选"按钮） */
  filterFields?: FilterFieldConfig[]
  /** 组合筛选是否有激活项 */
  hasActiveFilters?: boolean
  /** 点击"筛选"或回车时触发 */
  onApply: (params: {
    searchField: string
    searchValue: FilterValue
    filters: Record<string, FilterValue>
  }) => void
  /** 点击"重置" */
  onReset: () => void
  /** 右侧额外操作按钮 */
  actions?: React.ReactNode
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** 日期范围选择器 */
function DateRangePicker({
  value,
  onChange,
  placeholder = '选择日期范围',
}: {
  value: DateRange
  onChange: (v: DateRange) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  const displayText = useMemo(() => {
    if (value.from) {
      const from = format(value.from, 'yyyy-MM-dd')
      if (value.to) return `${from} ~ ${format(value.to, 'yyyy-MM-dd')}`
      return from
    }
    return ''
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-start gap-2 rounded-none border-0 bg-transparent px-3 text-sm text-[#323232] outline-none',
            !displayText && 'text-[#969696]'
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-[#969696]" />
          <span className="truncate">{displayText || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={(range) => {
            if (range) {
              onChange({ from: range.from, to: range.to ?? undefined })
              if (range.from && range.to) setOpen(false)
            }
          }}
          numberOfMonths={2}
        />
        <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { onChange({}); setOpen(false) }}
          >
            清除
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** 多选下拉 */
function MultiSelect({
  options,
  value,
  onChange,
  placeholder = '请选择',
}: {
  options: SelectOption[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  const toggle = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
    )
  }

  const displayText = useMemo(() => {
    if (value.length === 0) return ''
    const labels = value
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .join('、')
    return labels.length > 20 ? `${labels.slice(0, 20)}... (${value.length})` : labels
  }, [value, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-1 rounded-none border-0 bg-transparent px-3 text-sm text-[#323232] outline-none',
            !displayText && 'text-[#969696]'
          )}
        >
          <span className="truncate">{displayText || placeholder}</span>
          {displayText ? (
            <X
              className="size-3.5 shrink-0 text-[#969696] hover:text-[#323232]"
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
            />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-2"
        align="start"
      >
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f5f5f5]"
            >
              <Checkbox
                checked={value.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {value.length > 0 && (
          <div className="border-t pt-1 mt-1">
            <button
              type="button"
              className="w-full text-center text-xs text-[#969696] hover:text-[#323232]"
              onClick={() => onChange([])}
            >
              清除选择
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function emptyDrafts(fields: FilterFieldConfig[]): Record<string, FilterValue> {
  const m: Record<string, FilterValue> = {}
  for (const f of fields) {
    m[f.key] = f.type === 'select' ? [] : f.type === 'date' ? {} : ''
  }
  return m
}

function defaultValueForField(f: FilterFieldConfig): FilterValue {
  return f.type === 'select' ? [] : f.type === 'date' ? {} : ''
}

function cloneDrafts(drafts: Record<string, FilterValue>, fields: FilterFieldConfig[]): Record<string, FilterValue> {
  const m: Record<string, FilterValue> = {}
  for (const f of fields) {
    const raw = drafts[f.key]
    const v: FilterValue = raw === undefined ? defaultValueForField(f) : raw
    m[f.key] = Array.isArray(v)
      ? [...v]
      : typeof v === 'object' && v !== null
        ? { ...v }
        : v
  }
  return m
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SearchFilterBar({
  searchFields,
  filterFields,
  hasActiveFilters = false,
  onApply,
  onReset,
  actions,
  className,
}: SearchFilterBarProps) {
  const allFilterFields = filterFields ?? []
  const defaultField = searchFields[0]

  /* ---- quick-search state ---- */
  const [draftField, setDraftField] = useState<string>(defaultField?.key ?? '')
  const [draftSearchValue, setDraftSearchValue] = useState<FilterValue>(
    defaultField?.type === 'select' ? [] : defaultField?.type === 'date' ? {} : ''
  )

  /* ---- combined-filter state ---- */
  const [combinedOpen, setCombinedOpen] = useState(false)
  const [combinedDraft, setCombinedDraft] = useState<Record<string, FilterValue>>(
    () => emptyDrafts(allFilterFields)
  )
  const [combinedApplied, setCombinedApplied] = useState<Record<string, FilterValue>>(
    () => emptyDrafts(allFilterFields)
  )

  const currentFieldConfig = useMemo(
    () => searchFields.find((f) => f.key === draftField) ?? defaultField,
    [draftField, searchFields, defaultField]
  )

  /* ---- actions ---- */
  const handleApply = useCallback(() => {
    onApply({
      searchField: draftField,
      searchValue: draftSearchValue,
      filters: cloneDrafts(combinedDraft, allFilterFields),
    })
    setCombinedApplied(cloneDrafts(combinedDraft, allFilterFields))
    setCombinedOpen(false)
  }, [draftField, draftSearchValue, combinedDraft, allFilterFields, onApply])

  const handleReset = useCallback(() => {
    const d = defaultField
    setDraftField(d?.key ?? '')
    setDraftSearchValue(d?.type === 'select' ? [] : d?.type === 'date' ? {} : '')
    setCombinedDraft(emptyDrafts(allFilterFields))
    setCombinedApplied(emptyDrafts(allFilterFields))
    setCombinedOpen(false)
    onReset()
  }, [defaultField, allFilterFields, onReset])

  const resetCombinedDraftOnly = useCallback(() => {
    setCombinedDraft(emptyDrafts(allFilterFields))
  }, [allFilterFields])

  const cancelCombined = useCallback(() => {
    setCombinedDraft(cloneDrafts(combinedApplied, allFilterFields))
    setCombinedOpen(false)
  }, [combinedApplied, allFilterFields])

  const updateCombinedField = useCallback((key: string, value: FilterValue) => {
    setCombinedDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  /* ---- render field control ---- */
  const renderControl = (
    field: FilterFieldConfig,
    value: FilterValue,
    onChange: (v: FilterValue) => void,
    isQuickSearch: boolean,
  ) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleApply() }}
            placeholder={field.placeholder ?? `请输入${field.label}`}
            className={cn(
              'h-9 min-w-[160px] flex-1 bg-transparent px-3 text-sm text-[#323232] placeholder:text-[#969696]',
              isQuickSearch
                ? 'rounded-none border-0 shadow-none focus-visible:z-10 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0'
                : 'border-[#e9ebec] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/25'
            )}
            aria-label={`按${field.label}搜索`}
          />
        )
      case 'date':
        return (
          <DateRangePicker
            value={value as DateRange}
            onChange={onChange}
            placeholder={field.placeholder ?? `选择${field.label}范围`}
          />
        )
      case 'select':
        return (
          <MultiSelect
            options={field.options ?? []}
            value={value as string[]}
            onChange={onChange}
            placeholder={field.placeholder ?? `请选择${field.label}`}
          />
        )
    }
  }

  /* ---- render ---- */
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      {/* 左侧：搜索区 */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {/* 组合筛选按钮 */}
        {allFilterFields.length > 0 && (
          <Popover
            open={combinedOpen}
            onOpenChange={(open) => {
              if (open) setCombinedDraft(cloneDrafts(combinedApplied, allFilterFields))
              setCombinedOpen(open)
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-normal whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors',
                  'focus-visible:border-[#ff7f32] focus-visible:ring-[3px] focus-visible:ring-[#ff7f32]/25',
                  hasActiveFilters
                    ? 'border-[#ffc299] bg-[#fff5ed] text-[#ff7f32] hover:bg-[#ffefe4]'
                    : 'border-[#e9ebec] bg-white text-[#323232] hover:bg-[#f9f9f9]'
                )}
              >
                <Filter className={cn('size-4', hasActiveFilters ? 'text-[#ff7f32]' : 'text-[#646464]')} />
                所有筛选
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
              className="w-[min(960px,calc(100vw-2rem))] max-h-[min(70vh,560px)] overflow-y-auto rounded-lg border border-[#e9ebec] bg-white p-0 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)]"
            >
              <div className="border-b border-[#e9ebec] bg-white px-4 py-3">
                <p className="text-sm font-semibold text-[#323232]">组合筛选</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                {allFilterFields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#323232]">
                      {field.label}
                    </Label>
                    {renderControl(
                      field,
                      combinedDraft[field.key] ?? defaultValueForField(field),
                      (v) => updateCombinedField(field.key, v),
                      false
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-[#e9ebec] bg-[#f9f9f9] px-4 py-3">
                <Button
                  type="button"
                  onClick={handleApply}
                  className="h-9 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-4 text-sm font-normal text-white hover:bg-[#ff6a14]"
                >
                  筛选
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelCombined}
                  className="h-9 rounded-lg border-[#e9ebec] bg-white px-4 text-sm font-normal text-[#323232] hover:bg-[#f9f9f9]"
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCombinedDraftOnly}
                  className="h-9 rounded-lg border-[#e9ebec] bg-white px-4 text-sm font-normal text-[#323232] hover:bg-[#f9f9f9]"
                >
                  重置
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* 快捷搜索栏 */}
        <div className="flex h-9 min-w-0 max-w-[480px] flex-1 overflow-hidden rounded-lg border border-[#e9ebec] bg-white transition-[box-shadow,border-color] focus-within:border-[#ff7f32] focus-within:ring-2 focus-within:ring-[#ff7f32]/20">
          {/* 字段选择器 */}
          {searchFields.length > 1 && (
            <Select
              value={draftField}
              onValueChange={(v) => {
                const field = searchFields.find((f) => f.key === v)
                if (!field) return
                setDraftField(v)
                setDraftSearchValue(
                  field.type === 'select' ? [] : field.type === 'date' ? {} : ''
                )
              }}
            >
              <SelectTrigger
                size="default"
                className="h-9 w-[132px] shrink-0 rounded-none border-0 border-r border-[#e9ebec] bg-transparent px-3 text-sm font-normal text-[#323232] shadow-none hover:bg-transparent focus-visible:z-10 focus-visible:border-[#ff7f32] focus-visible:ring-0 data-[size=default]:h-9 [&_svg]:opacity-60"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#e9ebec]" position="popper">
                <SelectGroup>
                  {searchFields.map((f) => (
                    <SelectItem key={f.key} value={f.key} className="cursor-pointer text-sm">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          {/* 动态控件 */}
          {currentFieldConfig &&
            renderControl(
              currentFieldConfig,
              draftSearchValue,
              setDraftSearchValue,
              true
            )}
        </div>

        {/* 筛选/重置按钮 */}
        <Button
          type="button"
          onClick={handleApply}
          className="h-9 shrink-0 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-4 text-sm font-normal text-white hover:bg-[#ff6a14]"
        >
          筛选
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="h-9 shrink-0 rounded-lg border-0 bg-[#ececec] px-4 text-sm font-normal text-[#323232] hover:bg-[#e0e0e0]"
        >
          重置
        </Button>
      </div>

      {/* 右侧：操作按钮 */}
      {actions && (
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
    </div>
  )
}
