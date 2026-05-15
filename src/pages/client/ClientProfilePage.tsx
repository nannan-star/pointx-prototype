import { useState, useEffect, useCallback } from 'react'
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
import { clientProfile } from '@/data/admin-system-mock'

function VerificationCodeInput({
  phone,
  email,
  verifyType,
  code,
  onCodeChange,
}: {
  phone: string
  email: string
  verifyType: 'phone' | 'email'
  code: string
  onCodeChange: (v: string) => void
}) {
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSend = useCallback(() => {
    setCountdown(60)
  }, [])

  const target = verifyType === 'phone' ? phone : email

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-[#f9f9f9] px-3 py-2.5">
        {verifyType === 'phone' ? (
          <Phone className="size-4 shrink-0 text-[#969696]" />
        ) : (
          <Mail className="size-4 shrink-0 text-[#969696]" />
        )}
        <span className="text-sm text-[#323232]">{target}</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          placeholder="请输入验证码"
          maxLength={6}
          className="h-8 flex-1 rounded-lg border-[#e9ebec] text-sm placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
        />
        <Button
          variant="outline"
          disabled={countdown > 0}
          onClick={handleSend}
          className="h-8 shrink-0 rounded-lg border-[#ff7f32] text-[#ff7f32] hover:bg-[#ff7f32]/5 disabled:border-[#e9ebec] disabled:text-[#969696]"
        >
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </Button>
      </div>
    </div>
  )
}

export default function ClientProfilePage() {
  const u = clientProfile
  const [pwdDrawerOpen, setPwdDrawerOpen] = useState(false)
  const [verifyType, setVerifyType] = useState<'phone' | 'email'>('phone')
  const [code, setCode] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleChangePassword() {
    if (!code || !newPwd || !confirmPwd) return
    if (newPwd !== confirmPwd) return
    if (newPwd.length < 6) return
    alert('密码已更新（演示）')
    setPwdDrawerOpen(false)
    setCode('')
    setNewPwd('')
    setConfirmPwd('')
  }

  function resetPwdForm() {
    setVerifyType('phone')
    setCode('')
    setNewPwd('')
    setConfirmPwd('')
    setShowNew(false)
    setShowConfirm(false)
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
      {/* User Identity Banner */}
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
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { resetPwdForm(); setPwdDrawerOpen(true) }}
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
            <p className="text-xs text-[#969696]" />
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
        <SheetContent className="sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-[#e9ebec] p-4 pb-3">
            <SheetTitle className="text-sm font-semibold text-[#323232]">修改密码</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-[18px]">
              {/* 验证方式切换 */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">验证方式</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyType('phone')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      verifyType === 'phone'
                        ? 'border-[#ff7f32] bg-[#fff5ed] text-[#ff7f32]'
                        : 'border-[#e9ebec] bg-white text-[#646464] hover:border-[#d0d0d0]'
                    }`}
                  >
                    <Phone className="size-3.5" />
                    手机号验证
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyType('email')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      verifyType === 'email'
                        ? 'border-[#ff7f32] bg-[#fff5ed] text-[#ff7f32]'
                        : 'border-[#e9ebec] bg-white text-[#646464] hover:border-[#d0d0d0]'
                    }`}
                  >
                    <Mail className="size-3.5" />
                    邮箱验证
                  </button>
                </div>
              </div>

              {/* 验证码输入 */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 验证码
                </Label>
                <VerificationCodeInput
                  phone={u.phone}
                  email={u.email}
                  verifyType={verifyType}
                  code={code}
                  onCodeChange={setCode}
                />
              </div>

              {/* 新密码 */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 新密码
                </Label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="h-8 rounded-lg border-[#e9ebec] pr-10 text-sm placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
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

              {/* 确认新密码 */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-normal text-[#646464]">
                  <span className="text-[#eb2e2e]">*</span> 确认新密码
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    className="h-8 rounded-lg border-[#e9ebec] pr-10 text-sm placeholder:text-[#969696] focus-visible:border-[#ff7f32] focus-visible:ring-[#ff7f32]/20"
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
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-[#e9ebec] px-4 py-3">
            <Button
              variant="outline"
              onClick={() => setPwdDrawerOpen(false)}
              className="h-8 rounded-lg border border-[#f9f9f9] bg-[#e9ebec] px-3 text-sm text-[#323232] hover:bg-[#dcdfe1]"
            >
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              className="h-8 rounded-lg border border-[#ffa05c] bg-[#ff7f32] px-3 text-sm text-[#f9f9f9] hover:bg-[#e8722d]"
            >
              确认修改
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
