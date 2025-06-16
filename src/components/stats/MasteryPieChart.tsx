"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Label, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const chartConfig = {
  "已掌握": {
    label: "已掌握",
    color: "var(--chart-2)",
  },
  "学习中": {
    label: "学习中",
    color: "var(--chart-3)",
  },
  "待学习": {
    label: "待学习",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function MasteryPieChart() {
  const stats = useLiveQuery(async () => {
    const newCount = await db.studyRecords.where("status").equals("new").count();
    const learningCount = await db.studyRecords.where("status").equals("learning").count();
    const masteredCount = await db.studyRecords.where("status").equals("mastered").count();
    
    return {
      newCount,
      learningCount,
      masteredCount,
      total: newCount + learningCount + masteredCount,
    };
  }, []);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { status: "已掌握", count: stats.masteredCount },
      { status: "学习中", count: stats.learningCount },
      { status: "待学习", count: stats.newCount },
    ].filter(item => item.count > 0);
  }, [stats]);

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex justify-center items-center h-60">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (stats.total === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>掌握程度分布</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-60">
          <p className="text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>掌握程度分布</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.status}`}
                  fill={chartConfig[entry.status as keyof typeof chartConfig]?.color}
                />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {stats.total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          总计
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="status" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}