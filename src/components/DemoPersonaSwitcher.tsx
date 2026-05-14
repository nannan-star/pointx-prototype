import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDemoPersona } from '@/context/DemoPersonaContext'
import { DEMO_PERSONA_OPTIONS, isDemoPersonaId } from '@/lib/demo-persona'
import { cn } from '@/lib/utils'

type DemoPersonaSwitcherProps = {
  /** 浅色顶栏（管理端） */
  variant?: 'light' | 'gray'
}

export function DemoPersonaSwitcher({ variant = 'light' }: DemoPersonaSwitcherProps) {
  const { personaId, setPersonaId } = useDemoPersona()

  const triggerClass =
    variant === 'light'
      ? 'h-9 max-w-[min(92vw,280px)] cursor-pointer gap-2 rounded-lg border border-[#e9ebec] bg-white px-2.5 text-xs font-normal text-[#323232] shadow-none hover:bg-[#f9f9f9] focus-visible:ring-[#ff7f32]/25'
      : 'h-9 max-w-[min(92vw,280px)] cursor-pointer gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-normal text-gray-800 shadow-none hover:bg-gray-50 focus-visible:ring-blue-500/25'

  return (
    <Select
      value={personaId}
      onValueChange={(value) => {
        if (isDemoPersonaId(value)) setPersonaId(value)
      }}
    >
      <SelectTrigger
        aria-label="切换演示视角"
        title="在此下拉切换管理员 / 企业租户演示视角"
        className={cn(triggerClass, '[&_svg]:opacity-60')}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-left">
          <span className="shrink-0 text-[#969696]">当前视角</span>
          <span className="shrink-0 text-[#969696]" aria-hidden>
            ·
          </span>
          <SelectValue placeholder="选择视角" className="min-w-0 truncate font-medium text-[#323232]" />
        </span>
      </SelectTrigger>
      <SelectContent align="end" position="popper" className="w-[min(92vw,280px)] border-[#e9ebec]">
        <SelectGroup>
          <SelectLabel className="text-xs font-normal text-[#969696]">演示：多客户角色切换</SelectLabel>
          {DEMO_PERSONA_OPTIONS.map((opt) => (
            <SelectItem
              key={opt.id}
              value={opt.id}
              title={opt.label}
              textValue={`${opt.shortLabel} ${opt.label}`}
              className={cn(
                'cursor-pointer py-2 text-sm font-medium text-[#323232]',
                opt.id === personaId && 'bg-[#fff3e5]'
              )}
            >
              {opt.shortLabel}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
