import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface TopPage {
  path: string
  views: number
}

interface TopPagesChartProps {
  data: TopPage[]
  isLoading?: boolean
}

// Custom tick renderer to truncate long paths
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomYAxisTick(props: any) {
  const { x, y, payload } = props
  const path = payload?.value ?? ''
  const maxLength = 30
  const displayPath = path.length > maxLength
    ? path.substring(0, maxLength - 3) + '...'
    : path

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="rgba(255,255,255,0.6)"
      fontSize={11}
    >
      {displayPath}
    </text>
  )
}

export function TopPagesChart({ data, isLoading }: TopPagesChartProps) {
  if (isLoading) {
    return (
      <div className="h-[400px] animate-pulse rounded bg-muted" />
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No page data available
      </div>
    )
  }

  // Limit to top 10 entries
  const chartData = data.slice(0, 10)

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
        >
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="path"
            stroke="rgba(255,255,255,0.6)"
            tickLine={false}
            axisLine={false}
            tick={CustomYAxisTick}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#fff',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            itemStyle={{ color: '#3B82F6' }}
            formatter={(value) => [(value as number).toLocaleString(), 'Views']}
          />
          <Bar
            dataKey="views"
            fill="#3B82F6"
            radius={[0, 4, 4, 0]}
            name="Views"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
