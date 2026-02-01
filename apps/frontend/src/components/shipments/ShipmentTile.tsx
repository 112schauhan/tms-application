import { Link } from 'react-router-dom';

interface Location {
  city: string;
  state: string;
  country: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  shipperName: string;
  consigneeName: string;
  status: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  carrierName: string | null;
  rate: number | null;
  currency: string | null;
  isFlagged: boolean;
  pickupDate: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
}

interface ShipmentTileProps {
  shipments: Shipment[];
  loading?: boolean;
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

  const statusIcons: Record<string, string> = {
    PENDING: '⏳',
    PICKED_UP: '📥',
    IN_TRANSIT: '🚚',
    OUT_FOR_DELIVERY: '🚛',
    DELIVERED: '✅',
    CANCELLED: '❌',
    ON_HOLD: '⏸️',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      <span>{statusIcons[status] || '📦'}</span>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShipmentTile({ shipments, loading }: ShipmentTileProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
        <p className="text-gray-500 mb-4">Try adjusting your filters or create a new shipment</p>
        <Link
          to="/shipments/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create Shipment
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shipments.map((shipment) => (
        <Link
          key={shipment.id}
          to={`/shipments/${shipment.id}`}
          className={`block bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all ${
            shipment.isFlagged ? 'border-red-200 bg-red-50' : 'border-gray-100'
          }`}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {shipment.isFlagged && <span className="text-red-500">🚩</span>}
                <span className="font-semibold text-gray-900">{shipment.trackingNumber}</span>
              </div>
              <StatusBadge status={shipment.status} />
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase">From</p>
                <p className="text-sm font-medium text-gray-900">{shipment.pickupLocation.city}</p>
                <p className="text-xs text-gray-500">{shipment.pickupLocation.state}</p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500 uppercase">To</p>
                <p className="text-sm font-medium text-gray-900">{shipment.deliveryLocation.city}</p>
                <p className="text-xs text-gray-500">{shipment.deliveryLocation.state}</p>
              </div>
            </div>

            {/* Details */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Carrier</p>
                <p className="font-medium text-gray-900">{shipment.carrierName || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Rate</p>
                <p className="font-medium text-gray-900">
                  {shipment.rate ? `$${shipment.rate.toFixed(2)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Shipper</p>
                <p className="font-medium text-gray-900 truncate">{shipment.shipperName}</p>
              </div>
              <div>
                <p className="text-gray-500">ETA</p>
                <p className="font-medium text-gray-900">
                  {shipment.estimatedDelivery 
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                    : '—'
                  }
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
