import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useMetricsSummary, useTopPages } from '@/hooks/use-metrics'
import { TrendingUp, BarChart3 } from 'lucide-react'

export function MetricsPage() {
  const [days, setDays] = useState(7)
  const { data: summary, isLoading: summaryLoading } = useMetricsSummary()
  const { data: topPages, isLoading: topPagesLoading } = useTopPages({ days, limit: 20 })

  return (
    <Shell title="Metrics">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              Pageview statistics for your content
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary?.total.toLocaleString() ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">All time views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary?.today.toLocaleString() ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Views today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary?.last7Days.toLocaleString() ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Views in last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary?.trend.reduce((sum, val) => sum + val, 0).toLocaleString() ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Approximate from trend data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Pages</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="days-filter" className="text-sm">
                    Time period:
                  </Label>
                  <Select
                    id="days-filter"
                    value={days.toString()}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-32"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {topPagesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : topPages?.data && topPages.data.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">
                          Rank
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Path
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-32">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.data.map((page, index) => (
                        <tr key={page.path} className="border-b">
                          <td className="p-4 align-middle font-medium">#{index + 1}</td>
                          <td className="p-4 align-middle">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {page.path}
                            </code>
                          </td>
                          <td className="p-4 align-middle text-right font-medium">
                            {page.views.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-sm font-semibold">No pageviews recorded yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pageviews will appear here once visitors access your content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
