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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">个人中心</h1>
        <p className="mt-1 text-sm text-[#969696]">
          管理您的个人信息、账户安全与实名认证
        </p>
      </div>

      {/* User Identity Banner */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="h-1 bg-gradient-to-r from-[#ff7f32] via-[#ff9a5c] to-[#ff7f32]" />
        <div className="flex items-center gap-5 px-7 py-5">
          <div className="relative">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff7f32] to-[#e06820] text-2xl font-bold text-white shadow-md shadow-[#ff7f32]/20">
              {u.name.charAt(0)}
            </div>
            <div className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-[#22c55e] ring-2 ring-white">
              <div className="size-2 rounded-full bg-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#1a1a1a]">{u.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7f32]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff7f32]">
                <Shield className="size-3" />
                {u.role}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#646464]">{u.company}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <span className="flex items-center gap-1.5 text-xs text-[#969696]">
                <Phone className="size-3" />
                {u.phone}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#969696]">
                <Mail className="size-3" />
                {u.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#969696]">
                <MapPin className="size-3" />
                {u.region}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Sections Grid */}
      <div className="grid grid-cols-2 gap-5">
        {infoSections.map((section) => {
          const SectionIcon = section.icon
          return (
            <div
              key={section.title}
              className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 flex items-center gap-2.5 border-b border-[#e9ebec] pb-3">
                <div
                  className="flex size-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${section.color}10` }}
                >
                  <SectionIcon className="size-3.5" style={{ color: section.color }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{section.title}</h3>
              </div>
              <div className="space-y-3">
                {section.fields.map((field) => {
                  const FieldIcon = field.icon
                  return (
                    <div key={field.label} className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f9f9f9]">
                        <FieldIcon className="size-3.5 text-[#969696]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-[#969696]">{field.label}</p>
                        <p className="text-sm font-medium text-[#323232]">{field.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Account Security Card */}
      <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5 border-b border-[#e9ebec] px-6 py-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10">
            <Lock className="size-3.5 text-[#ff7f32]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">账户安全</h3>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#f9f9f9]">
                <Lock className="size-4 text-[#969696]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#323232]">登录密码</p>
                <p className="mt-0.5 text-xs text-[#969696]">定期更换密码有助于保障账户安全</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPwdDrawerOpen(true)}
              className="gap-1.5 border-[#e9ebec] text-[#323232] hover:border-[#ff7f32] hover:text-[#ff7f32]"
            >
              修改密码
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ID Card Upload Section */}
      <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5 border-b border-[#e9ebec] px-6 py-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#3b82f6]/10">
            <CreditCard className="size-3.5 text-[#3b82f6]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">法人身份证</h3>
        </div>
        <div className="px-6 py-5">
          <p className="mb-4 text-xs text-[#969696]">
            请上传法人身份证正反面照片，支持 JPG/PNG 格式，大小不超过 5MB
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '身份证正面（人像面）', placeholder: '人像面' },
              { label: '身份证反面（国徽面）', placeholder: '国徽面' },
            ].map((item) => (
              <button
                key={item.label}
                className="group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e9ebec] bg-[#fafbfc] p-8 transition-colors hover:border-[#ff7f32]/40 hover:bg-[#ff7f32]/[0.02]"
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
