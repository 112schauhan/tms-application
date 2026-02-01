import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GET_SHIPMENT, UPDATE_SHIPMENT_STATUS, FLAG_SHIPMENT, UNFLAG_SHIPMENT, DELETE_SHIPMENT } from '../../graphql/operations';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Location {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface TrackingEvent {
  id: string;
  status: string;
  timestamp: string;
  description: string;
  location?: { city: string; state: string };
}

interface Shipment {
  id: string;
  trackingNumber: string;
  shipperName: string;
  shipperPhone: string | null;
  shipperEmail: string | null;
  consigneeName: string;
  consigneePhone: string | null;
  consigneeEmail: string | null;
  status: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  carrierName: string | null;
  carrierPhone: string | null;
  weight: number | null;
  dimensions: Dimensions | null;
  rate: number | null;
  currency: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  pickupDate: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  notes: string | null;
  trackingEvents: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
  createdBy?: { firstName: string; lastName: string };
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PICKED_UP: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-200',
    OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    ON_HOLD: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const STATUS_OPTIONS = [
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'ON_HOLD',
];

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, loading, error } = useQuery<{ shipment: Shipment }>(GET_SHIPMENT, {
    variables: { id },
    skip: !id,
  });

  const [updateStatus] = useMutation(UPDATE_SHIPMENT_STATUS, {
    refetchQueries: [{ query: GET_SHIPMENT, variables: { id } }],
  });

  const [flagShipment] = useMutation(FLAG_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENT, variables: { id } }],
  });

  const [unflagShipment] = useMutation(UNFLAG_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENT, variables: { id } }],
  });

  const [deleteShipment] = useMutation(DELETE_SHIPMENT);

  const shipment = data?.shipment;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ variables: { id, status: newStatus } });
      setShowStatusModal(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    try {
      await flagShipment({ variables: { id, reason: flagReason } });
      setShowFlagModal(false);
      setFlagReason('');
    } catch (err) {
      console.error('Failed to flag shipment:', err);
    }
  };

  const handleUnflag = async () => {
    try {
      await unflagShipment({ variables: { id } });
    } catch (err) {
      console.error('Failed to unflag shipment:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteShipment({ variables: { id } });
      navigate('/shipments');
    } catch (err) {
      console.error('Failed to delete shipment:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Shipment not found</h3>
        <p className="text-gray-500 mb-4">The shipment you're looking for doesn't exist</p>
        <Link
          to="/shipments"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/shipments" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center">
            ← Back to Shipments
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {shipment.isFlagged && <span className="text-red-500">🚩</span>}
            {shipment.trackingNumber}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Status
          </button>
          <Link
            to={`/shipments/${id}/edit`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Edit
          </Link>
          {isAdmin && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Flag Alert */}
      {shipment.isFlagged && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-red-800">🚩 This shipment is flagged</p>
            <p className="text-sm text-red-600">{shipment.flagReason}</p>
          </div>
          <button
            onClick={handleUnflag}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
          >
            Remove Flag
          </button>
        </div>
      )}

      {/* Main Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <StatusBadge status={shipment.status} />
            {!shipment.isFlagged && (
              <button
                onClick={() => setShowFlagModal(true)}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                🚩 Flag Shipment
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-lg">📦</span> Origin
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="font-medium text-gray-900">{shipment.shipperName}</p>
              <p className="text-sm text-gray-600">{shipment.pickupLocation.address}</p>
              <p className="text-sm text-gray-600">
                {shipment.pickupLocation.city}, {shipment.pickupLocation.state} {shipment.pickupLocation.postalCode}
              </p>
              <p className="text-sm text-gray-600">{shipment.pickupLocation.country}</p>
              {shipment.shipperPhone && (
                <p className="text-sm text-gray-500">📞 {shipment.shipperPhone}</p>
              )}
              {shipment.shipperEmail && (
                <p className="text-sm text-gray-500">✉️ {shipment.shipperEmail}</p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-lg">📍</span> Destination
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="font-medium text-gray-900">{shipment.consigneeName}</p>
              <p className="text-sm text-gray-600">{shipment.deliveryLocation.address}</p>
              <p className="text-sm text-gray-600">
                {shipment.deliveryLocation.city}, {shipment.deliveryLocation.state} {shipment.deliveryLocation.postalCode}
              </p>
              <p className="text-sm text-gray-600">{shipment.deliveryLocation.country}</p>
              {shipment.consigneePhone && (
                <p className="text-sm text-gray-500">📞 {shipment.consigneePhone}</p>
              )}
              {shipment.consigneeEmail && (
                <p className="text-sm text-gray-500">✉️ {shipment.consigneeEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="p-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Carrier</p>
            <p className="font-medium text-gray-900">{shipment.carrierName || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rate</p>
            <p className="font-medium text-gray-900">
              {shipment.rate ? `${shipment.currency || '$'}${shipment.rate.toFixed(2)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Weight</p>
            <p className="font-medium text-gray-900">
              {shipment.weight ? `${shipment.weight} lbs` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dimensions</p>
            <p className="font-medium text-gray-900">
              {shipment.dimensions 
                ? `${shipment.dimensions.length}×${shipment.dimensions.width}×${shipment.dimensions.height}` 
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pickup Date</p>
            <p className="font-medium text-gray-900">
              {shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estimated Delivery</p>
            <p className="font-medium text-gray-900">
              {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Actual Delivery</p>
            <p className="font-medium text-gray-900">
              {shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium text-gray-900">
              {shipment.createdBy ? `${shipment.createdBy.firstName} ${shipment.createdBy.lastName}` : '—'}
            </p>
          </div>
        </div>

        {/* Notes */}
        {shipment.notes && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{shipment.notes}</p>
          </div>
        )}
      </div>

      {/* Tracking History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tracking History</h3>
        {shipment.trackingEvents.length === 0 ? (
          <p className="text-gray-500">No tracking events yet</p>
        ) : (
          <div className="space-y-4">
            {shipment.trackingEvents.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  {index < shipment.trackingEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-gray-900">{event.status}</p>
                  <p className="text-sm text-gray-500">{event.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                    {event.location && ` • ${event.location.city}, ${event.location.state}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    shipment.status === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Flag Shipment</h3>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for flagging..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowFlagModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Shipment</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this shipment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
