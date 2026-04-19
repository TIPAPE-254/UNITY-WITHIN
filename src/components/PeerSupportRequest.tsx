/**
 * Peer Support Request Component
 * Allows clients to request voice/video calls with community listener volunteers
 */

import React, { useState, useEffect } from 'react';
import { requestPeerSupportCall, getAvailableListeners } from '../services/volunteerService';

interface PeerSupportRequestProps {
  userEmail?: string;
  userName?: string;
}

interface Listener {
  id: number;
  user_email: string;
  phone?: string;
  calls_handled: number;
  average_rating?: number;
  is_available: boolean;
}

export const PeerSupportRequest: React.FC<PeerSupportRequestProps> = ({
  userEmail = '',
  userName = 'Friend'
}) => {
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [callId, setCallId] = useState('');
  const [callInProgress, setCallInProgress] = useState(false);

  // Load available listeners on mount
  useEffect(() => {
    loadListeners();
  }, []);

  const loadListeners = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getAvailableListeners();
      setListeners(data.listeners || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load available listeners'
      );
      setListeners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCall = async () => {
    if (!userEmail) {
      setError('Please log in to request peer support');
      return;
    }

    const availableListeners = listeners.filter((l) => l.is_available);
    if (availableListeners.length === 0) {
      setError('No community listeners are currently available. Please try again later.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await requestPeerSupportCall(userEmail, callType);

      if (response.call_id) {
        setCallId(response.call_id);
        setCallInProgress(true);
        setSuccess(
          `Call request sent! A community listener will connect with you shortly for a ${callType} call.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request peer support call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = () => {
    setCallInProgress(false);
    setCallId('');
    setSuccess('');
    loadListeners();
  };

  if (callInProgress && callId) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border border-purple-200">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {callType === 'video' ? '📹' : '☎️'} Call in Progress
            </h3>
            <p className="text-gray-600 mb-4">Connected with a Community Listener</p>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6 border border-purple-200">
            <p className="text-sm text-gray-600 mb-4">Call Type: <span className="font-semibold text-purple-600 capitalize">{callType}</span></p>
            <div className="flex justify-center gap-4 mb-4">
              {callType === 'video' && (
                <div className="bg-gray-200 rounded-lg w-full h-48 flex items-center justify-center">
                  <span className="text-gray-600">Video stream will appear here</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            End Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border border-purple-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">💬 Peer Support</h2>
        <p className="text-gray-600">
          Connect with trained community listeners for voice or video support when you need someone to talk to.
        </p>
      </div>

      {/* Available Listeners Status */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
        <button
          onClick={loadListeners}
          className="text-sm text-purple-600 hover:text-purple-800 underline mb-3"
        >
          Refresh listeners ({listeners.length})
        </button>
        
        {listeners.length > 0 ? (
          <div className="space-y-2">
            {listeners.map((listener) => (
              <div
                key={listener.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  listener.is_available
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      listener.is_available ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Community Listener</p>
                    <p className="text-sm text-gray-600">
                      {listener.calls_handled} calls • {listener.average_rating || 'No rating'}⭐
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    listener.is_available ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {listener.is_available ? 'Available' : 'Busy'}
                </span>
              </div>
            ))}
          </div>
        ) : isLoading ? (
          <p className="text-gray-600 text-center py-4">Loading listeners...</p>
        ) : (
          <p className="text-gray-600 text-center py-4">
            No community listeners available at the moment. Check back soon!
          </p>
        )}
      </div>

      {/* Call Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Choose Call Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="callType"
              value="voice"
              checked={callType === 'voice'}
              onChange={() => setCallType('voice')}
              className="mr-3 w-4 h-4 text-purple-600"
            />
            <span className="text-gray-700">☎️ Voice Call</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="callType"
              value="video"
              checked={callType === 'video'}
              onChange={() => setCallType('video')}
              className="mr-3 w-4 h-4 text-purple-600"
            />
            <span className="text-gray-700">📹 Video Call</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">✓ {success}</p>
        </div>
      )}

      {/* Request Button */}
      <button
        onClick={handleRequestCall}
        disabled={isLoading || listeners.filter((l) => l.is_available).length === 0}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
          isLoading || listeners.filter((l) => l.is_available).length === 0
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
        }`}
      >
        {isLoading ? 'Connecting...' : 'Request Peer Support Call'}
      </button>

      {/* Info Text */}
      <p className="text-sm text-gray-600 text-center mt-4">
        All conversations are confidential and provided by trained community volunteers.
      </p>
    </div>
  );
};

export default PeerSupportRequest;
