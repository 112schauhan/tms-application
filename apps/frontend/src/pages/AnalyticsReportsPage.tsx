import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react';
import { GET_SHIPMENTS } from '../graphql/operations';

interface Shipment {
  id: string;
  trackingNumber: string;
  shipperName: string;
  consigneeName: string;
  status: string;
  carrierName: string | null;
  rate: number | null;
  pickupLocation: { city: string; state: string };
  deliveryLocation: { city: string; state: string };
  createdAt: string;
  estimatedDelivery: string | null;
}

function ReportCard({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function exportToCSV(data: Record<string, unknown>[], filename: string, headers: string[]) {
  if (data.length === 0) return;
  const headerRow = headers.join(',');
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  const csv = [headerRow, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AnalyticsReportsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const dateFilter = (() => {
    if (dateRange === 'all') return undefined;
    const to = new Date();
    to.setHours(23, 59, 59, 999); // End of today
    const from = new Date(to);
    if (dateRange === '7d') from.setDate(from.getDate() - 7);
    else if (dateRange === '30d') from.setDate(from.getDate() - 30);
    else if (dateRange === '90d') from.setDate(from.getDate() - 90);
    from.setHours(0, 0, 0, 0); // Start of that day
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  })();

  const { data: shipmentsData, loading: shipmentsLoading } = useQuery<{
    shipments: { edges: { node: Shipment }[]; pageInfo: { totalCount: number } };
  }>(GET_SHIPMENTS, {
    variables: {
      filter: dateFilter ? { dateRange: dateFilter } : undefined,
      sort: { field: 'CREATED_AT', order: 'DESC' },
      pagination: { limit: 100, page: 1 },
    },
    fetchPolicy: 'network-only', // Always refetch when date range changes
  });

  const shipments: Shipment[] = (() => {
    const nodes = shipmentsData?.shipments?.edges?.map((e) => e.node) ?? [];
    const seen = new Set<string>();
    return nodes.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  })();
  const totalCount = shipmentsData?.shipments?.pageInfo?.totalCount ?? 0;

  // Derive stats from filtered shipments so date range applies to all reports
  const stats = (() => {
    if (!shipments.length) {
      return {
        total: 0,
        pending: 0,
        pickedUp: 0,
        inTransit: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0,
        onHold: 0,
        averageRate: 0,
      };
    }
    const statusCounts: Record<string, number> = {};
    let totalRate = 0;
    let rateCount = 0;
    for (const s of shipments) {
      statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
      if (s.rate != null) {
        totalRate += s.rate;
        rateCount++;
      }
    }
    return {
      total: shipments.length,
      pending: statusCounts.PENDING ?? 0,
      pickedUp: statusCounts.PICKED_UP ?? 0,
      inTransit: statusCounts.IN_TRANSIT ?? 0,
      outForDelivery: statusCounts.OUT_FOR_DELIVERY ?? 0,
      delivered: statusCounts.DELIVERED ?? 0,
      cancelled: statusCounts.CANCELLED ?? 0,
      onHold: statusCounts.ON_HOLD ?? 0,
      averageRate: rateCount > 0 ? totalRate / rateCount : 0,
    };
  })();

  const loading = shipmentsLoading;

  // Carrier report
  const carrierReport = shipments.reduce((acc, s) => {
    const name = s.carrierName || 'Unknown';
    if (!acc[name]) acc[name] = { count: 0, totalRate: 0 };
    acc[name].count++;
    acc[name].totalRate += s.rate ?? 0;
    return acc;
  }, {} as Record<string, { count: number; totalRate: number }>);

  const carrierRows = Object.entries(carrierReport)
    .map(([name, d]) => ({
      carrier: name,
      shipments: d.count,
      totalRevenue: d.totalRate,
      avgRate: d.totalRate / d.count,
    }))
    .sort((a, b) => b.shipments - a.shipments);

  // Route report
  const routeReport = shipments.reduce((acc, s) => {
    const from = `${s.pickupLocation?.city || '-'}, ${s.pickupLocation?.state || '-'}`;
    const to = `${s.deliveryLocation?.city || '-'}, ${s.deliveryLocation?.state || '-'}`;
    const key = `${from} → ${to}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const routeRows = Object.entries(routeReport)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const handleExportShipments = () => {
    const headers = [
      'trackingNumber',
      'shipperName',
      'consigneeName',
      'status',
      'carrierName',
      'rate',
      'origin',
      'destination',
      'createdAt',
    ];
    const data = shipments.map((s) => ({
      trackingNumber: s.trackingNumber,
      shipperName: s.shipperName,
      consigneeName: s.consigneeName,
      status: s.status,
      carrierName: s.carrierName ?? '',
      rate: s.rate ?? '',
      origin: `${s.pickupLocation?.city ?? ''} ${s.pickupLocation?.state ?? ''}`.trim(),
      destination: `${s.deliveryLocation?.city ?? ''} ${s.deliveryLocation?.state ?? ''}`.trim(),
      createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
    }));
    exportToCSV(data, `shipments-report-${dateRange}.csv`, headers);
  };

  if (loading && !shipmentsData) {
    return (
      <div className="space-y-6">
        <Link
          to="/analytics"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-48 bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Detailed Reports</h1>
          <p className="text-gray-500 mt-1">
            Shipment analytics, carrier performance, and route insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button
            onClick={handleExportShipments}
            disabled={shipments.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Report */}
      <ReportCard title="Summary Report" icon={FileText}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Shipments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total ?? 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase">Delivered</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats?.delivered ?? 0}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase">Cancelled</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats?.cancelled ?? 0}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase">Avg. Rate</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              ${stats?.averageRate?.toFixed(2) ?? '0.00'}
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
          <p className="text-sm font-medium text-indigo-900">Delivery Rate</p>
          <p className="text-3xl font-bold text-indigo-700 mt-1">
            {stats?.total
              ? ((stats.delivered / stats.total) * 100).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            {stats?.delivered ?? 0} of {stats?.total ?? 0} shipments delivered
          </p>
        </div>
      </ReportCard>

      {/* Status Breakdown */}
      <ReportCard title="Status Breakdown" icon={Package}>
        <div className="space-y-3">
          {[
            { key: 'PENDING', count: stats?.pending ?? 0, color: 'bg-yellow-500' },
            { key: 'PICKED_UP', count: stats?.pickedUp ?? 0, color: 'bg-blue-500' },
            { key: 'IN_TRANSIT', count: stats?.inTransit ?? 0, color: 'bg-purple-500' },
            { key: 'OUT_FOR_DELIVERY', count: stats?.outForDelivery ?? 0, color: 'bg-indigo-500' },
            { key: 'DELIVERED', count: stats?.delivered ?? 0, color: 'bg-green-500' },
            { key: 'CANCELLED', count: stats?.cancelled ?? 0, color: 'bg-red-500' },
            { key: 'ON_HOLD', count: stats?.onHold ?? 0, color: 'bg-gray-500' },
          ].map(({ key, count, color }) => {
            const pct = stats?.total ? (count / stats.total) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-4">
                <span className="w-36 text-sm text-gray-700">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-900">{count}</span>
              </div>
            );
          })}
        </div>
      </ReportCard>

      {/* Carrier Performance */}
      <ReportCard title="Carrier Performance" icon={Truck}>
        {carrierRows.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No carrier data in selected period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-medium text-gray-700">Carrier</th>
                  <th className="text-right py-3 font-medium text-gray-700">Shipments</th>
                  <th className="text-right py-3 font-medium text-gray-700">Total Revenue</th>
                  <th className="text-right py-3 font-medium text-gray-700">Avg. Rate</th>
                </tr>
              </thead>
              <tbody>
                {carrierRows.map((row) => (
                  <tr key={row.carrier} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-gray-900">{row.carrier}</td>
                    <td className="py-3 text-right font-medium">{row.shipments}</td>
                    <td className="py-3 text-right text-green-700">
                      ${row.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">${row.avgRate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>

      {/* Top Routes */}
      <ReportCard title="Top Routes (Origin → Destination)" icon={MapPin}>
        {routeRows.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No route data in selected period</p>
        ) : (
          <div className="space-y-3">
            {routeRows.map(({ route, count }) => (
              <div
                key={route}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
              >
                <span className="text-sm text-gray-900">{route}</span>
                <span className="text-sm font-semibold text-blue-600">{count} shipments</span>
              </div>
            ))}
          </div>
        )}
      </ReportCard>

      {/* Recent Shipments Table */}
      <ReportCard title="Recent Shipments" icon={TrendingUp}>
        <p className="text-sm text-gray-500 mb-4">
          Showing {shipments.length} of {totalCount} shipments
        </p>
        {shipments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No shipments in selected period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-medium text-gray-700">Tracking #</th>
                  <th className="text-left py-3 font-medium text-gray-700">Shipper</th>
                  <th className="text-left py-3 font-medium text-gray-700">Route</th>
                  <th className="text-left py-3 font-medium text-gray-700">Carrier</th>
                  <th className="text-left py-3 font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 font-medium text-gray-700">Rate</th>
                  <th className="text-left py-3 font-medium text-gray-700">Created</th>
                  <th className="text-left py-3 font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 20).map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-mono text-gray-900">{s.trackingNumber}</td>
                    <td className="py-3 text-gray-700">{s.shipperName}</td>
                    <td className="py-3 text-gray-600">
                      {s.pickupLocation?.city ?? '-'} → {s.deliveryLocation?.city ?? '-'}
                    </td>
                    <td className="py-3 text-gray-700">{s.carrierName || '—'}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : s.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {s.rate != null ? `$${s.rate.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 text-gray-600">
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/shipments/${s.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>
    </div>
  );
}
