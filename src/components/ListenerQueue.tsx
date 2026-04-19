/**
 * Listener Queue Component
 * Shows pending peer support calls for community listener volunteers
 */

import React, { useState, useEffect } from 'react';
import {
  getListenerQueue,
  updatePeerSupportCallStatus,
  toggleListenerAvailability
} from '../services/volunteerService';

interface ListenerQueueProps {
  userEmail?: string;
  userName?: string;
}

interface PendingCall {
  id: string;
  client_email: string;
  call_type: 'voice' | 'video';
  status: 'pending' | 'active' | 'ended';
  created_at: string;
  duration_seconds?: number;
}

interface QueueData {
  pending_calls: PendingCall[];
  active_call?: PendingCall;
  is_available: boolean;
  calls_handled: number;
  average_rating: number;
}

export const ListenerQueue: React.FC<ListenerQueueProps> = ({
  userEmail = '',
  userName = 'Listener'
}) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeCallId, setActiveCallId] = useState('');

  // Load queue on mount and set up polling
  useEffect(() => {
    if (!userEmail) return;
    loadQueue();
    const interval = setInterval(loadQueue, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadQueue = async () => {
    if (!userEmail) return;
    try {
      setError('');
      const data = await getListenerQueue(userEmail);
      setQueueData(data);
      setIsAvailable(data.is_available);
    } catch (err) {
      console.error('Error loading queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    }
  };

  const handleAcceptCall = async (callId: string) => {
    try {
      setError('');
      setIsLoading(true);
      await updatePeerSupportCallStatus(callId, 'active', userEmail);
      setActiveCallId(callId);
      setIsLoading(false);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept call');
      setIsLoading(false);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      setError('');
      setIsLoading(true);
      await updatePeerSupportCallStatus(callId, 'ended', userEmail);
      setActiveCallId('');
      setIsLoading(false);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end call');
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setError('');
      setIsLoading(true);
      await toggleListenerAvailability(userEmail, !isAvailable);
      setIsAvailable(!isAvailable);
      setIsLoading(false);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
      setIsLoading(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
        <p className="text-red-700 font-semibold">Please log in to view the listener queue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">🎧 Listener Queue</h2>
            <p className="text-purple-100">Manage incoming peer support calls</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-100 mb-2">Status</p>
            <button
              onClick={handleToggleAvailability}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isAvailable
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {isAvailable ? '🟢 Online' : '⚫ Offline'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {queueData && (
          <div className="flex gap-8 mt-6 pt-6 border-t border-purple-300">
            <div>
              <p className="text-purple-100 text-sm">Calls Handled</p>
              <p className="text-2xl font-bold">{queueData.calls_handled}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Average Rating</p>
              <p className="text-2xl font-bold">{queueData.average_rating.toFixed(1)}⭐</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Pending Calls</p>
              <p className="text-2xl font-bold">{queueData.pending_calls.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Active Call Section */}
      {queueData?.active_call && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-400 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                🟢 Call in Progress
              </h3>
              <p className="text-gray-600">
                {queueData.active_call.call_type === 'video' ? '📹' : '☎️'}{' '}
                <span className="font-semibold capitalize">{queueData.active_call.call_type} Call</span>
              </p>
            </div>
            <span className="text-sm font-semibold text-green-600 bg-white px-3 py-1 rounded-full border border-green-200">
              Active
            </span>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Client: <span className="font-mono text-gray-800">{queueData.active_call.client_email}</span></p>
            {queueData.active_call.call_type === 'video' && (
              <div className="mt-4 bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <span className="text-gray-600">Video stream appears here during call</span>
              </div>
            )}
          </div>

          <button
            onClick={() => handleEndCall(queueData.active_call!.id)}
            disabled={isLoading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Ending...' : 'End Call'}
          </button>
        </div>
      )}

      {/* Pending Calls Queue */}
      <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📋 Pending Calls ({queueData?.pending_calls.length || 0})
        </h3>

        {queueData && queueData.pending_calls.length > 0 ? (
          <div className="space-y-3">
            {queueData.pending_calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {call.call_type === 'video' ? '📹' : '☎️'}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {call.call_type === 'video' ? 'Video Call' : 'Voice Call'}
                      </p>
                      <p className="text-xs text-gray-600">{call.client_email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptCall(call.id)}
                  disabled={isLoading || !isAvailable}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  {isLoading ? 'Processing...' : 'Accept'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">✨</p>
            <p className="text-gray-600 font-medium">No pending calls</p>
            <p className="text-sm text-gray-500 mt-2">
              {isAvailable ? 'You are online and ready to accept calls.' : 'Go online to receive calls'}
            </p>
          </div>
        )}
      </div>

      {/* Recent Calls History Note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> Keep your status online to receive peer support requests. You can manage your availability using the status button above.
        </p>
      </div>
    </div>
  );
};

export default ListenerQueue;
