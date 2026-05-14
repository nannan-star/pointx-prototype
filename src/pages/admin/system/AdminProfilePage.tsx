import { useState } from 'react'
import {
  Shield,
  Building2,
  Smartphone,
  Mail,
  Lock,
  ChevronRight,
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { adminProfile } from '@/data/admin-system-mock'

export default function AdminProfilePage() {
  const u = adminProfile
  const [pwdDrawerOpen, setPwdDrawerOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ old: '', new1: '', new2: '' })

  function handleChangePassword() {
    if (!pwdForm.old || !pwdForm.new1 || !pwdForm.new2) return
    if (pwdForm.new1 !== pwdForm.new2) return
    if (pwdForm.new1.length < 6) return
    alert('密码已更新（演示）')
    setPwdDrawerOpen(false)
    setPwdForm({ old: '', new1: '', new2: '' })
  }

  const infoSections = [
    {
      title: '基本资料',
      icon: Shield,
      fields: [
        { label: '姓名', value: u.name },
        { label: '手机号', value: u.phone },
        { label: '邮箱', value: u.email },
      ],
    },
    {
      title: '组织与范围',
      icon: Building2,
      fields: [
        { label: '所属单位', value: u.company },
        { label: '数据范围', value: u.region },
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Profile Hero Banner ── */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#ff7f32] via-[#ff9a5c] to-[#ff7f32]" />

        <div className="px-8 pb-8 pt-7">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="flex size-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff7f32] to-[#e06820] text-[28px] font-bold text-white shadow-md shadow-[#ff7f32]/20">
                {u.name.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#22c55e]">
                <span className="sr-only">在线</span>
              </div>
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1a1a1a]">{u.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7f32]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff7f32]">
                  <Shield className="size-3" />
                  {u.role}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#646464]">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-[#969696]" />
                  {u.company}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-[#969696]" />
                  {u.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 text-[#969696]" />
                  {u.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Cards Grid ── */}
      <div className="grid grid-cols-2 gap-5">
        {infoSections.map((section) => {
          const SectionIcon = section.icon
          return (
            <div
              key={section.title}
              className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
                  <SectionIcon className="size-4 text-[#ff7f32]" />
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.fields.map((f) => (
                  <div key={f.label} className="group">
                    <label className="mb-1 block text-xs font-medium text-[#969696]">
                      {f.label}
                    </label>
                    <div className="flex h-9 items-center rounded-lg border border-[#e9ebec] bg-[#f9f9f9] px-3 text-sm text-[#323232] transition-colors group-hover:border-[#d0d3d5]">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* ── Security Card (spans full width) ── */}
        <div className="col-span-2 rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <Lock className="size-4 text-[#ff7f32]" />
            </div>
            <h2 className="text-sm font-semibold text-[#1a1a1a]">账户安全</h2>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#e9ebec] bg-[#f9f9f9] px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#f0f0f0]">
                <Lock className="size-4 text-[#646464]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#323232]">登录密码</p>
                <p className="text-xs text-[#969696]">已设置，建议定期更换以保证账户安全</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#e9ebec] text-[#ff7f32] hover:border-[#ff7f32]/30 hover:bg-[#ff7f32]/5 hover:text-[#ff7f32]"
              onClick={() => setPwdDrawerOpen(true)}
            >
              修改密码
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Password Change Drawer ── */}
      <Sheet open={pwdDrawerOpen} onOpenChange={setPwdDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>修改密码</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 py-6">
            <p className="text-xs text-[#969696]">
              支持手机号 / 邮箱验证码校验；以下为演示表单。
            </p>
            <div className="space-y-2">
              <Label>当前密码 *</Label>
              <Input
                type="password"
                value={pwdForm.old}
                onChange={(e) => setPwdForm((f) => ({ ...f, old: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>新密码 *</Label>
              <Input
                type="password"
                value={pwdForm.new1}
                onChange={(e) => setPwdForm((f) => ({ ...f, new1: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>确认新密码 *</Label>
              <Input
                type="password"
                value={pwdForm.new2}
                onChange={(e) => setPwdForm((f) => ({ ...f, new2: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>验证方式</Label>
              <Select defaultValue="sms">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">手机号验证码</SelectItem>
                  <SelectItem value="email">邮箱验证码</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>验证码</Label>
              <Input placeholder="演示任意填写" />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleChangePassword}
              className="bg-[#ff7f32] hover:bg-[#e06820]"
            >
              保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
