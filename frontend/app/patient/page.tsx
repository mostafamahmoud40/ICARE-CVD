"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, HeartPulse, Thermometer, Weight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const bloodPressureData = [
  { week: "W1", systolic: 132, diastolic: 86 },
  { week: "W2", systolic: 129, diastolic: 84 },
  { week: "W3", systolic: 126, diastolic: 82 },
  { week: "W4", systolic: 124, diastolic: 80 },
  { week: "W5", systolic: 123, diastolic: 79 },
  { week: "W6", systolic: 121, diastolic: 78 },
];

const activityData = [
  { day: "Mon", minutes: 30 },
  { day: "Tue", minutes: 45 },
  { day: "Wed", minutes: 35 },
  { day: "Thu", minutes: 52 },
  { day: "Fri", minutes: 40 },
  { day: "Sat", minutes: 60 },
  { day: "Sun", minutes: 48 },
];

const pressureChartConfig = {
  systolic: {
    label: "Systolic",
    color: "hsl(var(--chart-1))",
  },
  diastolic: {
    label: "Diastolic",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const activityChartConfig = {
  minutes: {
    label: "Active Minutes",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Patient</h1>
        <p className="text-sm text-muted-foreground">
          Here is your latest cardiovascular health overview.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <HeartPulse className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">72 bpm</div>
            <p className="text-xs text-muted-foreground">Stable within target range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">121 / 78</div>
            <p className="text-xs text-muted-foreground">Improved from last 4 weeks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight</CardTitle>
            <Weight className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">74.8 kg</div>
            <p className="text-xs text-muted-foreground">-0.7 kg this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Body Temp</CardTitle>
            <Thermometer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">36.7 C</div>
            <p className="text-xs text-muted-foreground">No unusual changes</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blood Pressure Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="min-h-[280px] w-full" config={pressureChartConfig}>
              <LineChart data={bloodPressureData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="systolic"
                  stroke="var(--color-systolic)"
                  strokeWidth={2}
                  type="monotone"
                  dot={false}
                />
                <Line
                  dataKey="diastolic"
                  stroke="var(--color-diastolic)"
                  strokeWidth={2}
                  type="monotone"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="min-h-[280px] w-full" config={activityChartConfig}>
              <BarChart data={activityData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="minutes"
                  radius={6}
                  fill="var(--color-minutes)"
                  aria-label="Activity minutes"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
