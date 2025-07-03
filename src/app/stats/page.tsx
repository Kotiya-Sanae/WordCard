import { StatsSummary } from "@/components/stats/StatsSummary";
import { MasteryPieChart } from "@/components/stats/MasteryPieChart";
import { Header } from "@/components/layout/Header";

export default function StatsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="学习统计" />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <StatsSummary />
        <MasteryPieChart />
      </div>
    </div>
  );
}