import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ADMIN_API = `${BACKEND_URL}/api/admin`;

const TrialManagement = ({ getAuthHeaders }) => {
  const { toast } = useToast();
  
  const [trialUsers, setTrialUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [extensionDays, setExtensionDays] = useState('');
  const [convertPlan, setConvertPlan] = useState('solo');

  const statusColors = {
    active: 'text-green-500 bg-green-50',
    expired: 'text-red-500 bg-red-50',
    converted: 'text-blue-500 bg-blue-50',
    data_retention: 'text-yellow-500 bg-yellow-50'
  };

  const planOptions = [
    { value: 'solo', label: 'Solo Plan' },
    { value: 'annual', label: 'Annual Plan' },
    { value: 'additional_user', label: 'Additional User' },
    { value: 'additional_workspace', label: 'Additional Workspace' },
    { value: 'additional_company', label: 'Additional Company' }
  ];

  useEffect(() => {
    loadTrialData();
  }, []);

  const loadTrialData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, analyticsResponse] = await Promise.all([
        axios.get(`${ADMIN_API}/trial/users`, { headers: getAuthHeaders() }),
        axios.get(`${ADMIN_API}/trial/analytics`, { headers: getAuthHeaders() })
      ]);

      setTrialUsers(usersResponse.data.trial_users || []);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error('Error loading trial data:', error);
      toast({
        title: "Error",
        description: "Failed to load trial data",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendTrial = async (userEmail) => {
    if (!extensionDays || extensionDays < 1 || extensionDays > 30) {
      toast({
        title: "Invalid Extension",
        description: "Extension days must be between 1 and 30",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      await axios.post(`${ADMIN_API}/trial/extend/${userEmail}`, 
        { extension_days: parseInt(extensionDays) },
        { headers: getAuthHeaders() }
      );

      toast({
        title: "Trial Extended",
        description: `Successfully extended trial by ${extensionDays} days for ${userEmail}`,
        duration: 5000,
      });

      setSelectedUser(null);
      setExtensionDays('');
      loadTrialData();
    } catch (error) {
      console.error('Error extending trial:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to extend trial",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleConvertTrial = async (userEmail) => {
    try {
      await axios.post(`${ADMIN_API}/trial/convert/${userEmail}?plan_type=${convertPlan}`,
        {},
        { headers: getAuthHeaders() }
      );

      toast({
        title: "Trial Converted",
        description: `Successfully converted ${userEmail} to ${convertPlan} plan`,
        duration: 5000,
      });

      setSelectedUser(null);
      loadTrialData();
    } catch (error) {
      console.error('Error converting trial:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to convert trial",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleCleanupUser = async (userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete all data for ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${ADMIN_API}/trial/cleanup/${userEmail}`, {
        headers: getAuthHeaders()
      });

      toast({
        title: "User Data Cleaned",
        description: `Successfully deleted all data for ${userEmail}`,
        duration: 5000,
      });

      loadTrialData();
    } catch (error) {
      console.error('Error cleaning up user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to cleanup user data",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading trial data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Trial Analytics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{analytics.total_trial_users}</div>
              <div className="text-xs text-gray-300">Total Trials</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{analytics.active_trials}</div>
              <div className="text-xs text-gray-300">Active</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{analytics.converted_trials}</div>
              <div className="text-xs text-gray-300">Converted</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{analytics.conversion_rate}%</div>
              <div className="text-xs text-gray-300">Conversion Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-300 mb-2">Search Usage Distribution</div>
              <div className="space-y-1 text-xs text-gray-400">
                <div>0 searches: {analytics.search_usage_distribution?.['0_searches'] || 0}</div>
                <div>1-10 searches: {analytics.search_usage_distribution?.['1_10_searches'] || 0}</div>
                <div>11-25 searches: {analytics.search_usage_distribution?.['11_25_searches'] || 0}</div>
                <div>25+ searches: {analytics.search_usage_distribution?.['over_25_searches'] || 0}</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-300 mb-2">Trial Duration</div>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Days 1-3: {analytics.trial_duration_stats?.day_1_3 || 0}</div>
                <div>Days 4-7: {analytics.trial_duration_stats?.day_4_7 || 0}</div>
                <div>Completed 7 days: {analytics.trial_duration_stats?.completed_7_days || 0}</div>
                <div>Avg searches/trial: {analytics.avg_searches_per_trial || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Users Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Trial Users ({trialUsers.length})
          </h3>
          <Button
            onClick={loadTrialData}
            className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1"
          >
            Refresh
          </Button>
        </div>

        {trialUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No trial users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-2 text-gray-300 font-medium">User</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-medium">Progress</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-medium">Searches</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-medium">Started</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trialUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-2">
                      <div className="text-white font-medium">{user.email}</div>
                      {user.name && <div className="text-gray-400 text-xs">{user.name}</div>}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.trial_status] || 'text-gray-400 bg-gray-100'}`}>
                        {formatStatus(user.trial_status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      <div>Day {user.days_into_trial}</div>
                      <div className="text-xs text-gray-400">
                        {user.days_remaining > 0 ? `${user.days_remaining} days left` : 'Expired'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      <div>Today: {user.searches_used_today}/25</div>
                      <div className="text-xs text-gray-400">Total: {user.total_searches}</div>
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {formatDate(user.trial_start)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex space-x-1">
                        {user.trial_status === 'active' && (
                          <>
                            <Button
                              onClick={() => setSelectedUser({ ...user, action: 'extend' })}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1"
                            >
                              Extend
                            </Button>
                            <Button
                              onClick={() => setSelectedUser({ ...user, action: 'convert' })}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                            >
                              Convert
                            </Button>
                          </>
                        )}
                        {(user.trial_status === 'expired' || user.trial_status === 'data_retention') && (
                          <Button
                            onClick={() => handleCleanupUser(user.email)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                          >
                            Cleanup
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4">
              {selectedUser.action === 'extend' ? 'Extend Trial' : 'Convert Trial'}
            </h3>
            
            <div className="mb-4">
              <div className="text-gray-300 text-sm mb-2">User: {selectedUser.email}</div>
              <div className="text-gray-400 text-xs">
                Current Status: {formatStatus(selectedUser.trial_status)}
              </div>
            </div>

            {selectedUser.action === 'extend' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Extension Days (1-30)
                  </label>
                  <input
                    type="number"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(e.target.value)}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="7"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleExtendTrial(selectedUser.email)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={!extensionDays}
                  >
                    Extend Trial
                  </Button>
                  <Button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Plan Type
                  </label>
                  <select
                    value={convertPlan}
                    onChange={(e) => setConvertPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan.value} value={plan.value} className="bg-slate-800">
                        {plan.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleConvertTrial(selectedUser.email)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Convert to Paid
                  </Button>
                  <Button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialManagement;