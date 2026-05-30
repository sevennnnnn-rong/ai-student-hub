import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const tooltipStyle = {
  backgroundColor: 'rgba(18, 18, 30, 0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#f3f4f6',
  backdropFilter: 'blur(12px)',
}

export default function StudyTrendChart({ data }: { data: { date: string; minutes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="minutes"
          stroke="#00d4ff"
          strokeWidth={2}
          dot={{ r: 4, fill: '#00d4ff', strokeWidth: 0 }}
          activeDot={{ r: 6, stroke: '#00d4ff', strokeWidth: 2, fill: '#0a0a14' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
