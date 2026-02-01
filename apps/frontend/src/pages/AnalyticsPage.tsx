import { useQuery } from '@apollo/client/react';
import { GET_SHIPMENT_STATS, GET_SHIPMENTS } from '../graphql/operations';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';

interface ShipmentStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  averageRate: number;
}

export default function AnalyticsPage() {
  const { data, loading } = useQuery<{ shipmentStats: ShipmentStats }>(GET_SHIPMENT_STATS);
  const { data: shipmentsData } = useQuery<{
    shipments: { edges: { node: { status: string } }[] };
  }>(GET_SHIPMENTS, {
    variables: { pagination: { limit: 100 }, sort: { field: 'CREATED_AT', order: 'DESC' } },
  });

  const stats = data?.shipmentStats;
  const shipments = shipmentsData?.shipments?.edges?.map((e) => e.node) ?? [];
  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-32 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="text-gray-500 mt-1">Shipment statistics and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Shipments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total ?? 0}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                ${stats?.averageRate?.toFixed(2) ?? '0.00'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Delivery Rate</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                {stats?.total
                  ? ((stats.delivered / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-indigo-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats?.cancelled ?? 0}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Status Distribution Bar Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
          <p className="text-sm text-gray-500">Shipments by status (last 100)</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-4">
                <span className="w-28 text-sm text-gray-600">{status.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-gray-500 text-center py-8">No shipment data yet</p>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Link
            to="/analytics/reports"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View detailed reports →
          </Link>
        </div>
      </div>
    </div>
  );
}
