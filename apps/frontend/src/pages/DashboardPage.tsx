import { useQuery } from '@apollo/client/react';
import { GET_SHIPMENT_STATS, GET_SHIPMENTS } from '../graphql/operations';
import { Link } from 'react-router-dom';

interface ShipmentStats {
  total: number;
  pending: number;
  pickedUp: number;
  inTransit: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  onHold: number;
  averageRate: number;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  shipperName: string;
  consigneeName: string;
  status: string;
  pickupLocation: { city: string; state: string };
  deliveryLocation: { city: string; state: string };
  createdAt: string;
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  link 
}: { 
  title: string; 
  value: number | string; 
  icon: string; 
  color: string;
  link?: string;
}) {
  const content = (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`text-4xl ${color} opacity-20`}>{icon}</div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PICKED_UP: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-purple-100 text-purple-800',
    OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function DashboardPage() {
  const { data: statsData, loading: statsLoading } = useQuery<{ shipmentStats: ShipmentStats }>(GET_SHIPMENT_STATS);
  const { data: shipmentsData, loading: shipmentsLoading } = useQuery<{
    shipments: { edges: { node: Shipment }[] }
  }>(GET_SHIPMENTS, {
    variables: {
      pagination: { limit: 5 },
      sort: { field: 'CREATED_AT', order: 'DESC' },
    },
  });

  const stats = statsData?.shipmentStats;
  const recentShipments = shipmentsData?.shipments?.edges?.map((edge) => edge.node) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your transportation operations</p>
        </div>
        <Link
          to="/shipments/new"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Shipment
        </Link>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Shipments" 
            value={stats?.total || 0} 
            icon="📦" 
            color="text-blue-600"
            link="/shipments"
          />
          <StatCard 
            title="Pending" 
            value={stats?.pending || 0} 
            icon="⏳" 
            color="text-yellow-600"
            link="/shipments?status=PENDING"
          />
          <StatCard 
            title="In Transit" 
            value={stats?.inTransit || 0} 
            icon="🚚" 
            color="text-purple-600"
            link="/shipments?status=IN_TRANSIT"
          />
          <StatCard 
            title="Delivered" 
            value={stats?.delivered || 0} 
            icon="✅" 
            color="text-green-600"
            link="/shipments?status=DELIVERED"
          />
        </div>
      )}

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <p className="text-blue-100 text-sm font-medium">Average Rate</p>
          <p className="text-3xl font-bold mt-2">
            ${stats?.averageRate?.toFixed(2) || '0.00'}
          </p>
          <p className="text-blue-200 text-sm mt-2">per shipment</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
          <p className="text-red-100 text-sm font-medium">Cancelled</p>
          <p className="text-3xl font-bold mt-2">{stats?.cancelled || 0}</p>
          <p className="text-red-200 text-sm mt-2">shipments</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
          <p className="text-green-100 text-sm font-medium">Delivery Rate</p>
          <p className="text-3xl font-bold mt-2">
            {stats?.total ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-green-200 text-sm mt-2">success rate</p>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
          <Link to="/shipments" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        
        {shipmentsLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : recentShipments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
            <p className="text-gray-500 mb-4">Create your first shipment to get started</p>
            <Link
              to="/shipments/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Shipment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentShipments.map((shipment: Shipment, index: number) => (
              <Link
                key={`${shipment.id}-${index}`}
                to={`/shipments/${shipment.id}`}
                className="flex items-start px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {shipment.trackingNumber}
                    </p>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {shipment.pickupLocation.city}, {shipment.pickupLocation.state} → {shipment.deliveryLocation.city}, {shipment.deliveryLocation.state}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
