import React from 'react';
import { MapPin, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { RegionalPerformance } from '../../types/dashboard';

interface RegionalPerformanceTableProps {
  data: RegionalPerformance[];
}

export const RegionalPerformanceTable: React.FC<RegionalPerformanceTableProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Regional Performance
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Revenue and order volume by territory</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400">4 Active Regions</span>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-2.5 font-bold">Region</th>
              <th className="pb-2.5 font-bold text-right">Revenue</th>
              <th className="pb-2.5 font-bold text-right">Growth</th>
              <th className="pb-2.5 font-bold text-right">Orders</th>
              <th className="pb-2.5 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr
                key={item.region}
                className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>{item.region} Region</span>
                </td>
                <td className="py-3 text-right font-extrabold text-slate-900">
                  {item.revenue}
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      item.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {item.growth}
                  </span>
                </td>
                <td className="py-3 text-right font-medium text-slate-600">
                  {item.orders}
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.status === 'Healthy'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'Attention'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.status === 'Healthy' ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                    )}
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
