import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { tooltipStyle } from '../../lib/chart-config'

const COLORS = ['#C20C0C', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#10b981', '#06b6d4', '#f97316']

export default function FocusDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  )
}
