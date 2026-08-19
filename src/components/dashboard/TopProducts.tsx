import React from 'react';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import { ProductPerformance } from '../../types/dashboard';

interface TopProductsProps {
  products: ProductPerformance[];
}

export const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Package className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Top Products
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Revenue distribution by SKU</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400">By Revenue</span>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {products.map((prod) => (
          <div key={prod.name} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{prod.name}</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                    prod.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {prod.isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {prod.growth}
                </span>
              </div>
              <span className="font-extrabold text-slate-900">{prod.revenue}</span>
            </div>

            {/* Miniature bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  prod.isPositive ? 'bg-indigo-600' : 'bg-slate-400'
                }`}
                style={{ width: `${prod.sharePct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
