import { useState } from 'react'
import {
  User,
  Shield,
  CreditCard,
  Building2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { clientProfile } from '@/data/admin-system-mock'

export default function ClientProfilePage() {
  const u = clientProfile
  const [pwdDrawerOpen, setPwdDrawerOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ old: '', new1: '', new2: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
      icon: User,
      title: '基本资料',
      color: '#ff7f32',
      fields: [
        { label: '姓名', value: u.name, icon: User },
        { label: '手机号', value: u.phone, icon: Phone },
        { label: '邮箱', value: u.email, icon: Mail },
        { label: '所在区域', value: u.region, icon: MapPin },
      ],
    },
    {
      icon: CreditCard,
      title: '实名与单位',
      color: '#3b82f6',
      fields: [
        { label: '身份证号', value: u.idCardMasked, icon: CreditCard },
        { label: '所属单位', value: u.organization, icon: Building2 },
      ],
    },
  ]

  const [basicSection, orgSection] = infoSections
  if (!basicSection || !orgSection) return null

  return (
    <div className="flex h-full flex-col gap-5">
      {/* User Identity Banner — full bleed */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#ff7f32] via-[#ff8f4a] to-[#ff9a5c] shadow-sm">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')]" />
        <div className="relative flex items-center gap-6 px-8 py-7">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold text-white shadow-lg backdrop-blur-sm ring-1 ring-white/20">
              {u.name.charAt(0)}
            </div>
            <div className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-[#22c55e] ring-3 ring-[#ff8f4a]">
              <div className="size-2 rounded-full bg-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{u.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                <Shield className="size-3" />
                {u.role}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-white/80">{u.company}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
              <span className="flex items-center gap-1.5 text-xs text-white/70">
                <Phone className="size-3" />
                {u.phone}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/70">
                <Mail className="size-3" />
                {u.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="size-3" />
                {u.region}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid — 3 columns */}
      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-5">
        {/* Left column: Basic Info */}
        <div className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[#e9ebec] pb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10">
              <User className="size-3.5 text-[#ff7f32]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">基本资料</h3>
          </div>
          <div className="space-y-4">
            {basicSection.fields.map((field) => {
              const FieldIcon = field.icon
              return (
                <div key={field.label} className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f9f9f9]">
                    <FieldIcon className="size-4 text-[#969696]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#969696]">{field.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#323232]">{field.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Middle column: Identity & Org */}
        <div className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[#e9ebec] pb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#3b82f6]/10">
              <CreditCard className="size-3.5 text-[#3b82f6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">实名与单位</h3>
          </div>
          <div className="space-y-4">
            {orgSection.fields.map((field) => {
              const FieldIcon = field.icon
              return (
                <div key={field.label} className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f9f9f9]">
                    <FieldIcon className="size-4 text-[#969696]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#969696]">{field.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#323232]">{field.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Account Security inline */}
          <div className="mt-5 border-t border-[#e9ebec] pt-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10">
                <Lock className="size-3.5 text-[#ff7f32]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1a1a1a]">账户安全</h3>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#fafbfc] px-4 py-3">
              <div className="flex items-center gap-3">
                <Lock className="size-4 text-[#969696]" />
                <div>
                  <p className="text-sm font-medium text-[#323232]">登录密码</p>
                  <p className="mt-0.5 text-[11px] text-[#969696]">定期更换保障账户安全</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPwdDrawerOpen(true)}
                className="gap-1.5 border-[#e9ebec] text-[#323232] hover:border-[#ff7f32] hover:text-[#ff7f32]"
              >
                修改
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: ID Card Upload */}
        <div className="flex flex-col rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2.5 border-b border-[#e9ebec] px-5 py-4">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#3b82f6]/10">
              <CreditCard className="size-3.5 text-[#3b82f6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">法人身份证</h3>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <p className="text-xs text-[#969696]">
              上传法人身份证正反面，支持 JPG/PNG，不超过 5MB
            </p>
            {[
              { label: '身份证正面（人像面）', placeholder: '人像面' },
              { label: '身份证反面（国徽面）', placeholder: '国徽面' },
            ].map((item) => (
              <button
                key={item.label}
                className="group relative flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e9ebec] bg-[#fafbfc] transition-colors hover:border-[#ff7f32]/40 hover:bg-[#ff7f32]/[0.02]"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-[#f0f1f2] transition-colors group-hover:bg-[#ff7f32]/10">
                  <Camera className="size-5 text-[#969696] transition-colors group-hover:text-[#ff7f32]" />
                </div>
                <span className="text-sm font-medium text-[#646464] transition-colors group-hover:text-[#ff7f32]">
                  上传{item.placeholder}
                </span>
                <span className="text-[11px] text-[#b0b0b0]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Password Change Drawer */}
      <Sheet open={pwdDrawerOpen} onOpenChange={setPwdDrawerOpen}>
        <SheetContent className="w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10">
                <Lock className="size-3.5 text-[#ff7f32]" />
              </div>
              修改密码
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-5 py-6">
            <p className="text-xs text-[#969696]">
              为保障账户安全，修改密码需验证身份。支持手机号或邮箱验证码校验。
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#646464]">当前密码</Label>
              <div className="relative">
                <Input
                  type={showOld ? 'text' : 'password'}
                  value={pwdForm.old}
                  onChange={e => setPwdForm(f => ({ ...f, old: e.target.value }))}
                  className="h-9 border-[#e9ebec] pr-10 focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
                  placeholder="请输入当前密码"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969696] hover:text-[#646464]"
                >
                  {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#646464]">新密码</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={pwdForm.new1}
                  onChange={e => setPwdForm(f => ({ ...f, new1: e.target.value }))}
                  className="h-9 border-[#e9ebec] pr-10 focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
                  placeholder="至少 6 位字符"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969696] hover:text-[#646464]"
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#646464]">确认新密码</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={pwdForm.new2}
                  onChange={e => setPwdForm(f => ({ ...f, new2: e.target.value }))}
                  className="h-9 border-[#e9ebec] pr-10 focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
                  placeholder="再次输入新密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969696] hover:text-[#646464]"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-[#e9ebec] pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#969696]">
                身份验证
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#646464]">验证方式</Label>
                  <Select defaultValue="sms">
                    <SelectTrigger className="h-9 border-[#e9ebec]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">手机号验证码（176****8356）</SelectItem>
                      <SelectItem value="email">邮箱验证码（176***@163.com）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#646464]">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="请输入验证码"
                      className="h-9 flex-1 border-[#e9ebec] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
                    />
                    <Button
                      variant="outline"
                      className="h-9 shrink-0 border-[#ff7f32] text-[#ff7f32] hover:bg-[#ff7f32]/5"
                    >
                      获取验证码
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t border-[#e9ebec] pt-4">
            <Button
              variant="outline"
              onClick={() => setPwdDrawerOpen(false)}
              className="border-[#e9ebec] text-[#323232]"
            >
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              className="bg-[#ff7f32] text-white hover:bg-[#ff6a14]"
            >
              确认修改
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
