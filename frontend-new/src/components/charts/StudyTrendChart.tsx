import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { tooltipStyle } from '../../lib/chart-config'

export default function StudyTrendChart({ data }: { data: { date: string; minutes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="minutes"
          stroke="#C20C0C"
          strokeWidth={2}
          dot={{ r: 4, fill: '#C20C0C', strokeWidth: 0 }}
          activeDot={{ r: 6, stroke: '#C20C0C', strokeWidth: 2, fill: '#0a0a14' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
