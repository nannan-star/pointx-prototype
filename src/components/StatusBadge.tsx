import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: string
  variant?: 'activate' | 'service' | 'cors'
}

/** 状态标签：根据状态文本自动匹配颜色 */
export function StatusBadge({ status, variant = 'service' }: StatusBadgeProps) {
  const normalized = status?.trim() || '—'

  const getClassName = () => {
    if (variant === 'activate') {
      if (normalized === '已激活') return 'bg-green-100 text-green-700 border-green-200'
      if (normalized === '未激活' || normalized === '待激活') return 'bg-gray-100 text-gray-600 border-gray-200'
      return 'bg-gray-100 text-gray-600 border-gray-200'
    }
    if (variant === 'cors') {
      if (normalized === '启用') return 'bg-green-100 text-green-700 border-green-200'
      if (normalized === '禁用') return 'bg-red-100 text-red-700 border-red-200'
      return 'bg-gray-100 text-gray-600 border-gray-200'
    }
    // service status
    if (normalized === '服务中') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (normalized === '已过期') return 'bg-red-100 text-red-700 border-red-200'
    if (normalized === '已停用') return 'bg-gray-100 text-gray-600 border-gray-200'
    return 'bg-gray-100 text-gray-600 border-gray-200'
  }

  return (
    <Badge variant="outline" className={`text-xs font-normal ${getClassName()}`}>
      {normalized}
    </Badge>
  )
}
