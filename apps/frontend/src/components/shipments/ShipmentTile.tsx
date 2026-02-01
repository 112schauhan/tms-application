import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { MoreVertical, Edit, Flag, Trash2, X } from 'lucide-react';
import { FLAG_SHIPMENT, UNFLAG_SHIPMENT, DELETE_SHIPMENT } from '../../graphql/operations';
import { useAuth } from '../../contexts/AuthContext';
import { GET_SHIPMENTS } from '../../graphql/operations';

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
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
      title={status.replace(/_/g, ' ')}
    >
      <span className="hidden sm:inline">{statusIcons[status] || '📦'}</span>
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
      {shipments.map((shipment, index) => (
        <TileCard key={`${shipment.id}-${index}`} shipment={shipment} />
      ))}
    </div>
  );
}

function TileCard({ shipment }: { shipment: Shipment }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  const [flagShipment] = useMutation(FLAG_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENTS }],
  });
  const [unflagShipment] = useMutation(UNFLAG_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENTS }],
  });
  const [deleteShipment] = useMutation(DELETE_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENTS }],
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    try {
      await flagShipment({ variables: { id: shipment.id, reason: flagReason } });
      setFlagModalOpen(false);
      setFlagReason('');
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to flag:', err);
    }
  };

  const handleUnflag = async () => {
    try {
      await unflagShipment({ variables: { id: shipment.id } });
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to unflag:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteShipment({ variables: { id: shipment.id } });
      setDeleteConfirmOpen(false);
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all overflow-hidden ${
        shipment.isFlagged ? 'border-red-200 bg-red-50' : 'border-gray-100'
      }`}
    >
      <Link to={`/shipments/${shipment.id}`} className="block p-4 sm:p-5 md:p-6">
        {/* Header: tracking number + status + actions in a clear flex row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {shipment.isFlagged && <span className="flex-shrink-0 text-red-500">🚩</span>}
              <span
                className="font-semibold text-gray-900 truncate block"
                title={shipment.trackingNumber}
              >
                {shipment.trackingNumber}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0" ref={menuRef}>
            <StatusBadge status={shipment.status} />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              title="Actions"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase">From</p>
            <p className="text-sm font-medium text-gray-900 truncate">{shipment.pickupLocation.city}</p>
            <p className="text-xs text-gray-500">{shipment.pickupLocation.state}</p>
          </div>
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-gray-500 uppercase">To</p>
            <p className="text-sm font-medium text-gray-900 truncate">{shipment.deliveryLocation.city}</p>
            <p className="text-xs text-gray-500">{shipment.deliveryLocation.state}</p>
          </div>
        </div>

        {/* Details grid with proper truncation */}
        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-4 text-sm">
          <div className="min-w-0">
            <p className="text-gray-500">Carrier</p>
            <p className="font-medium text-gray-900 truncate" title={shipment.carrierName || undefined}>
              {shipment.carrierName || '—'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-500">Rate</p>
            <p className="font-medium text-gray-900">
              {shipment.rate ? `$${shipment.rate.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="text-gray-500">Shipper</p>
            <p
              className="font-medium text-gray-900 truncate block"
              title={shipment.shipperName}
            >
              {shipment.shipperName}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-500">ETA</p>
            <p className="font-medium text-gray-900">
              {shipment.estimatedDelivery
                ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                : '—'
              }
            </p>
          </div>
        </div>
      </Link>

      {/* Action menu dropdown - outside Link to avoid nested <a> tags */}
      {menuOpen && (
        <div
          className="absolute right-4 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to={`/shipments/${shipment.id}`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            View details
          </Link>
          <Link
            to={`/shipments/${shipment.id}/edit`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
          {shipment.isFlagged ? (
            <button
              onClick={() => { handleUnflag(); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4" /> Remove flag
            </button>
          ) : (
            <button
              onClick={() => { setFlagModalOpen(true); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Flag className="w-4 h-4" /> Flag
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setDeleteConfirmOpen(true); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      )}

      {/* Flag modal */}
      {flagModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setFlagModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Flag Shipment</h3>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Reason for flagging..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setFlagModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleFlag} disabled={!flagReason.trim()} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete Shipment</h3>
            <p className="text-gray-600 mb-4">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
