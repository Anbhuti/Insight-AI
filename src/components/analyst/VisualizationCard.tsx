import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { VisualizationRecommendation } from '../../types/chat';
import { DatasetProfile } from '../../types/dataProfile';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, Sparkles } from 'lucide-react';

interface VisualizationCardProps {
  visualization: VisualizationRecommendation;
  profile?: DatasetProfile | null;
}

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export const VisualizationCard: React.FC<VisualizationCardProps> = ({
  visualization,
  profile,
}) => {
  // Generate preview data from profile if matched
  const chartData = React.useMemo(() => {
    if (!profile || !profile.columns) {
      return [
        { name: 'Group A', value: 400 },
        { name: 'Group B', value: 300 },
        { name: 'Group C', value: 550 },
        { name: 'Group D', value: 200 },
      ];
    }

    // Try finding categorical top values for x-axis
    const xCol = profile.columns.find(
      (c) => c.name.toLowerCase() === visualization.xAxisColumn?.toLowerCase()
    );
    const yCol = profile.columns.find(
      (c) => c.name.toLowerCase() === visualization.yAxisColumn?.toLowerCase()
    );

    if (xCol?.categoricalStats?.topValues && xCol.categoricalStats.topValues.length > 0) {
      return xCol.categoricalStats.topValues.slice(0, 6).map((item) => ({
        name: item.value.length > 12 ? item.value.substring(0, 10) + '...' : item.value,
        value: item.count,
      }));
    }

    if (yCol?.numericStats?.histogram && yCol.numericStats.histogram.length > 0) {
      return yCol.numericStats.histogram.slice(0, 6).map((bin) => ({
        name: bin.label,
        value: bin.count,
      }));
    }

    // Fallback using available categorical column
    const fallbackCat = profile.columns.find((c) => c.categoricalStats?.topValues?.length);
    if (fallbackCat?.categoricalStats?.topValues) {
      return fallbackCat.categoricalStats.topValues.slice(0, 5).map((item) => ({
        name: item.value.length > 12 ? item.value.substring(0, 10) + '...' : item.value,
        value: item.count,
      }));
    }

    return [
      { name: 'Segment 1', value: 120 },
      { name: 'Segment 2', value: 230 },
      { name: 'Segment 3', value: 180 },
      { name: 'Segment 4', value: 90 },
    ];
  }, [visualization, profile]);

  const renderIcon = () => {
    switch (visualization.chartType) {
      case 'bar':
      case 'histogram':
        return <BarChart3 className="w-4 h-4 text-indigo-600" />;
      case 'line':
        return <LineChartIcon className="w-4 h-4 text-blue-600" />;
      case 'pie':
        return <PieChartIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <TableIcon className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="my-3 rounded-2xl bg-white border border-indigo-100/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50/70 to-slate-50 border-b border-indigo-100/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white border border-indigo-200/80 flex items-center justify-center shadow-2xs shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                Recommended {visualization.chartType}
              </span>
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {visualization.title}
            </h4>
          </div>
        </div>
      </div>

      {/* Chart Visual Body */}
      <div className="p-4 bg-white">
        <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
          {visualization.description}
        </p>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {visualization.chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : visualization.chartType === 'pie' ? (
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {visualization.rationale && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 shrink-0">Rationale:</span>
            <span>{visualization.rationale}</span>
          </div>
        )}
      </div>
    </div>
  );
};
