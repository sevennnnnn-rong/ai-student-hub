import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const tooltipStyle = {
  backgroundColor: 'rgba(18, 18, 30, 0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#f3f4f6',
  backdropFilter: 'blur(12px)',
}

interface TaskData {
  name: string
  pending: number
  done: number
}

export default function TaskCompletionChart({ data }: { data: TaskData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={2}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="pending" name="待办" fill="#00d4ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="done" name="已完成" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
