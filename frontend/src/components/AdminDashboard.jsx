import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import Logo from './Logo';
import CustomPricingWidget from './CustomPricingWidget';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ADMIN_API = `${BACKEND_URL}/api/admin`;

const AdminDashboard = () => {
  const { admin, logout, getAuthHeaders } = useAdminAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalAnalytics, setGlobalAnalytics] = useState(null);
  const [userLookupEmail, setUserLookupEmail] = useState('');
  const [userMetrics, setUserMetrics] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Support management state
  const [supportDashboard, setSupportDashboard] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newAdminMessage, setNewAdminMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState('tickets');
  
  // Announcements management state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info',
    start_date: '',
    end_date: ''
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'analytics') {
      loadGlobalAnalytics();
    } else if (activeTab === 'users') {
      loadAllUsers();
    } else if (activeTab === 'support') {
      loadSupportData();
    } else if (activeTab === 'announcements') {
      loadAnnouncements();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${ADMIN_API}/analytics/dashboard`, {
        headers: getAuthHeaders()
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${ADMIN_API}/analytics/global-analytics`, {
        headers: getAuthHeaders()
      });
      setGlobalAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${ADMIN_API}/analytics/users?limit=100`, {
        headers: getAuthHeaders()
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserLookup = async (e) => {
    e.preventDefault();
    if (!userLookupEmail.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter a user email to lookup",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${ADMIN_API}/analytics/user-lookup`, {
        email: userLookupEmail.trim()
      }, {
        headers: getAuthHeaders()
      });
      setUserMetrics(response.data);
      toast({
        title: "User Found",
        description: `Successfully loaded data for ${userLookupEmail}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error looking up user:', error);
      let errorMessage = "Failed to lookup user";
      if (error.response?.status === 404) {
        errorMessage = "User not found";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast({
        title: "Lookup Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      setUserMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "Successfully logged out of admin panel",
        duration: 3000,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  };

  // Support management functions
  const loadSupportData = async () => {
    setIsLoading(true);
    try {
      // Load support dashboard
      const dashboardResponse = await axios.get(`${ADMIN_API}/support/dashboard`, {
        headers: getAuthHeaders()
      });
      setSupportDashboard(dashboardResponse.data);

      // Load support tickets
      const ticketsResponse = await axios.get(`${ADMIN_API}/support/tickets`, {
        headers: getAuthHeaders()
      });
      setSupportTickets(ticketsResponse.data);

      // Load chat messages
      const chatResponse = await axios.get(`${BACKEND_URL}/api/support/chat/messages`, {
        headers: getAuthHeaders()
      });
      setChatMessages(chatResponse.data);

      // Load notifications
      const notificationsResponse = await axios.get(`${ADMIN_API}/support/notifications?limit=20`, {
        headers: getAuthHeaders()
      });
      setAdminNotifications(notificationsResponse.data);

    } catch (error) {
      console.error('Error loading support data:', error);
      toast({
        title: "Error",
        description: "Failed to load support data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAdminChatMessage = async () => {
    if (!newAdminMessage.trim()) return;

    try {
      const response = await axios.post(`${ADMIN_API}/support/chat/message`, {
        message: newAdminMessage,
        reply_to_id: null
      }, {
        headers: getAuthHeaders()
      });

      setChatMessages(prev => [...prev, response.data]);
      setNewAdminMessage('');
      
      toast({
        title: "Message Sent",
        description: "Your message has been posted to the community chat",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error sending admin message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDeleteChatMessage = async (messageId) => {
    try {
      await axios.delete(`${ADMIN_API}/support/chat/message/${messageId}`, {
        headers: getAuthHeaders()
      });

      setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message Deleted",
        description: "The message has been removed from the chat",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await axios.put(`${ADMIN_API}/support/tickets/${ticketId}`, {
        status: newStatus
      }, {
        headers: getAuthHeaders()
      });

      setSupportTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? response.data : ticket
        )
      );
      
      toast({
        title: "Ticket Updated",
        description: `Ticket status changed to ${newStatus}`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`${ADMIN_API}/support/notifications/${notificationId}/read`, {}, {
        headers: getAuthHeaders()
      });

      setAdminNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Announcement management functions
  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${ADMIN_API}/support/announcements`, {
        headers: getAuthHeaders()
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const announcementData = {
        ...announcementForm,
        start_date: announcementForm.start_date ? new Date(announcementForm.start_date).toISOString() : null,
        end_date: announcementForm.end_date ? new Date(announcementForm.end_date).toISOString() : null
      };

      const response = await axios.post(`${ADMIN_API}/support/announcements`, announcementData, {
        headers: getAuthHeaders()
      });

      setAnnouncements(prev => [response.data, ...prev]);
      setAnnouncementForm({
        title: '',
        message: '',
        type: 'info',
        start_date: '',
        end_date: ''
      });

      toast({
        title: "Announcement Created",
        description: "The announcement has been created and will be visible to users",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAnnouncement = async (announcementId, isActive) => {
    try {
      const response = await axios.put(`${ADMIN_API}/support/announcements/${announcementId}`, {
        is_active: !isActive
      }, {
        headers: getAuthHeaders()
      });

      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement.id === announcementId ? response.data : announcement
        )
      );

      toast({
        title: "Announcement Updated",
        description: `Announcement ${!isActive ? 'activated' : 'deactivated'}`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`${ADMIN_API}/support/announcements/${announcementId}`, {
          headers: getAuthHeaders()
        });

        setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));

        toast({
          title: "Announcement Deleted",
          description: "The announcement has been deleted",
          duration: 3000,
        });

      } catch (error) {
        console.error('Error deleting announcement:', error);
        toast({
          title: "Error",
          description: "Failed to delete announcement",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg">
                <Logo showText={false} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">Admin Panel</h1>
                <p className="text-gray-300 text-sm">Use This Search</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                Welcome, {admin?.name || admin?.email}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-0">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'announcements', label: 'Announcements' },
              { id: 'support', label: 'Support Center' },
              { id: 'lookup', label: 'User Lookup' },
              { id: 'analytics', label: 'Global Analytics' },
              { id: 'users', label: 'All Users' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-white border-red-500 bg-white/10'
                    : 'text-gray-300 border-transparent hover:text-white hover:border-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Top Row - Custom Pricing and Support Dashboard */}
        <div className="flex gap-4 mb-2">
          {/* Custom Pricing Widget - Left Side */}
          <div className="w-80 flex-shrink-0">
            <CustomPricingWidget getAuthHeaders={getAuthHeaders} />
          </div>
          
          {/* Support Dashboard Stats - Right Side */}
          <div className="flex-1">
            {supportDashboard && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-white">Support Overview</h3>
                  <div className="flex items-center gap-2">
                    {supportDashboard.unread_notifications > 0 && (
                      <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {supportDashboard.unread_notifications} New
                      </div>
                    )}
                    {supportDashboard.open_tickets > 0 && (
                      <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {supportDashboard.open_tickets} Tickets
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{supportDashboard.open_tickets}</p>
                    <p className="text-gray-300 text-xs">Open Tickets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{supportDashboard.unread_notifications}</p>
                    <p className="text-gray-300 text-xs">Notifications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{supportDashboard.new_chat_messages}</p>
                    <p className="text-gray-300 text-xs">New Messages</p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <Button
                    onClick={() => setActiveTab('support')}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-1"
                  >
                    Manage Support
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="w-6 h-6 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white text-sm">Loading...</span>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white mb-2">Dashboard Overview</h2>
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <h3 className="text-gray-300 text-xs font-medium">Total Users</h3>
                <p className="text-xl font-bold text-white mt-1">
                  {formatNumber(dashboardData.global_analytics.total_users)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <h3 className="text-gray-300 text-xs font-medium">Total Searches</h3>
                <p className="text-xl font-bold text-white mt-1">
                  {formatNumber(dashboardData.global_analytics.total_searches)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <h3 className="text-gray-300 text-xs font-medium">Total Companies</h3>
                <p className="text-xl font-bold text-white mt-1">
                  {formatNumber(dashboardData.global_analytics.total_companies)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <h3 className="text-gray-300 text-xs font-medium">Monthly Revenue</h3>
                <p className="text-xl font-bold text-white mt-1">
                  ${formatNumber(dashboardData.global_analytics.subscription_revenue.current_month)}
                </p>
              </div>
            </div>

            {/* Recent Users */}
            {dashboardData.recent_users && dashboardData.recent_users.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Recent Active Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-gray-300 py-2">Email</th>
                        <th className="text-gray-300 py-2">Plan</th>
                        <th className="text-gray-300 py-2">Searches</th>
                        <th className="text-gray-300 py-2">Companies</th>
                        <th className="text-gray-300 py-2">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recent_users.slice(0, 10).map((user, index) => (
                        <tr key={index} className="border-b border-white/10">
                          <td className="text-white py-2">{user.user_email}</td>
                          <td className="text-white py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.subscription_plan === 'enterprise' ? 'bg-purple-500' :
                              user.subscription_plan === 'agency' ? 'bg-blue-500' :
                              user.subscription_plan === 'professional' ? 'bg-green-500' :
                              'bg-gray-500'
                            }`}>
                              {user.subscription_plan || 'Free'}
                            </span>
                          </td>
                          <td className="text-white py-2">{user.total_searches}</td>
                          <td className="text-white py-2">{user.total_companies}</td>
                          <td className="text-gray-300 py-2 text-sm">
                            {formatDate(user.last_activity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Lookup Tab */}
        {activeTab === 'lookup' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">User Lookup & Analysis</h2>
            
            {/* Lookup Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <form onSubmit={handleUserLookup} className="flex space-x-4">
                <input
                  type="email"
                  value={userLookupEmail}
                  onChange={(e) => setUserLookupEmail(e.target.value)}
                  placeholder="Enter user email address"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !userLookupEmail.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoading ? 'Looking up...' : 'Lookup User'}
                </Button>
              </form>
            </div>

            {/* User Metrics Display */}
            {userMetrics && (
              <div className="space-y-6">
                {/* User Overview */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">User Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-300 text-sm">Email</p>
                      <p className="text-white font-medium">{userMetrics.user_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Subscription Plan</p>
                      <p className="text-white font-medium">
                        {userMetrics.subscription_plan || 'Free User'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Status</p>
                      <p className="text-white font-medium">
                        {userMetrics.subscription_status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-gray-300 text-sm font-medium">Total Searches</h4>
                    <p className="text-2xl font-bold text-white mt-2">
                      {formatNumber(userMetrics.total_searches)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-gray-300 text-sm font-medium">Total Companies</h4>
                    <p className="text-2xl font-bold text-white mt-2">
                      {formatNumber(userMetrics.total_companies)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-gray-300 text-sm font-medium">This Month Searches</h4>
                    <p className="text-2xl font-bold text-white mt-2">
                      {formatNumber(userMetrics.usage_current_month.searches)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-gray-300 text-sm font-medium">Last Activity</h4>
                    <p className="text-sm text-white mt-2">
                      {formatDate(userMetrics.last_activity)}
                    </p>
                  </div>
                </div>

                {/* Recent Searches */}
                {userMetrics.recent_searches && userMetrics.recent_searches.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-xl font-bold text-white mb-4">Recent Searches</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-gray-300 py-2">Search Term</th>
                            <th className="text-gray-300 py-2">Results</th>
                            <th className="text-gray-300 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userMetrics.recent_searches.map((search, index) => (
                            <tr key={index} className="border-b border-white/10">
                              <td className="text-white py-2 font-medium">{search.search_term}</td>
                              <td className="text-gray-300 py-2">{search.suggestions_count}</td>
                              <td className="text-gray-300 py-2 text-sm">
                                {formatDate(search.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* User Companies */}
                {userMetrics.companies && userMetrics.companies.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-xl font-bold text-white mb-4">User Companies</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userMetrics.companies.map((company, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-white font-medium">{company.name}</h5>
                              <p className="text-gray-300 text-sm">
                                Created: {formatDate(company.created_at)}
                              </p>
                            </div>
                            {company.is_personal && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                Personal
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white mb-2">User Announcements</h2>

            {/* Create Announcement Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <h3 className="text-base font-semibold text-white mb-2">Create New Announcement</h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                      placeholder="e.g., New Training Available!"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                    <select
                      value={announcementForm.type}
                      onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                  <textarea
                    required
                    rows={3}
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                    placeholder="Enter your announcement message... This will appear to all users when they log in."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-vertical"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={announcementForm.start_date}
                      onChange={(e) => setAnnouncementForm({...announcementForm, start_date: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={announcementForm.end_date}
                      onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Creating...' : 'Create Announcement'}
                </Button>
              </form>
            </div>

            {/* Existing Announcements */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Existing Announcements</h3>
              
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id} 
                      className={`rounded-lg p-4 border ${
                        announcement.is_active 
                          ? 'bg-white/5 border-white/20' 
                          : 'bg-gray-500/20 border-gray-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-medium ${
                              announcement.is_active ? 'text-white' : 'text-gray-400'
                            }`}>
                              {announcement.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              announcement.type === 'info' ? 'bg-blue-500 text-white' :
                              announcement.type === 'success' ? 'bg-green-500 text-white' :
                              announcement.type === 'warning' ? 'bg-yellow-500 text-black' :
                              'bg-purple-500 text-white'
                            }`}>
                              {announcement.type.toUpperCase()}
                            </span>
                            {announcement.is_active ? (
                              <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
                                INACTIVE
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mb-2 ${
                            announcement.is_active ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {announcement.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>Created: {formatDate(announcement.created_at)}</span>
                            {announcement.start_date && (
                              <span>Starts: {formatDate(announcement.start_date)}</span>
                            )}
                            {announcement.end_date && (
                              <span>Ends: {formatDate(announcement.end_date)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAnnouncement(announcement.id, announcement.is_active)}
                            className={`${
                              announcement.is_active 
                                ? 'text-orange-400 border-orange-400 hover:bg-orange-400 hover:text-white'
                                : 'text-green-400 border-green-400 hover:bg-green-400 hover:text-white'
                            }`}
                          >
                            {announcement.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No announcements created yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Center Tab */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Support Management</h2>

            {/* Support Tabs */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="border-b border-white/20">
                <nav className="flex space-x-8 px-6">
                  {['tickets', 'chat', 'notifications'].map((tab) => (
                    <button
                      key={tab}
                      className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                        selectedTab === tab
                          ? 'border-red-500 text-white'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Support Tickets Management */}
                {selectedTab === 'tickets' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Support Tickets</h3>
                    {supportTickets.length > 0 ? (
                      <div className="space-y-3">
                        {supportTickets.map((ticket) => (
                          <div key={ticket.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-white font-medium">{ticket.subject}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    ticket.status === 'open' ? 'bg-yellow-500 text-black' :
                                    ticket.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                    ticket.status === 'resolved' ? 'bg-green-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }`}>
                                    {ticket.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">
                                    {ticket.category}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{ticket.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  <span>From: {ticket.user_email}</span>
                                  <span>Created: {formatDate(ticket.created_at)}</span>
                                  {ticket.updated_at !== ticket.created_at && (
                                    <span>Updated: {formatDate(ticket.updated_at)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                                  className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                                >
                                  In Progress
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                                  className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                                >
                                  Resolve
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No support tickets found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Management */}
                {selectedTab === 'chat' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Community Chat Management</h3>
                    
                    {/* Admin Message Input */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-medium mb-3">Post as Admin</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAdminMessage}
                          onChange={(e) => setNewAdminMessage(e.target.value)}
                          placeholder="Type your message to the community..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendAdminChatMessage()}
                        />
                        <Button
                          onClick={handleSendAdminChatMessage}
                          disabled={!newAdminMessage.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Send
                        </Button>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {chatMessages.length > 0 ? (
                        chatMessages.map((message) => (
                          <div key={message.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-sm font-medium ${
                                    message.is_admin ? 'text-red-400' : 'text-blue-400'
                                  }`}>
                                    {message.is_admin ? 'Support Team' : message.user_name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(message.created_at)}
                                  </span>
                                  {message.is_admin && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-300 text-sm">{message.message}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteChatMessage(message.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No chat messages found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {selectedTab === 'notifications' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Admin Notifications</h3>
                    {adminNotifications.length > 0 ? (
                      <div className="space-y-3">
                        {adminNotifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`rounded-lg p-4 border cursor-pointer transition-all ${
                              notification.is_read 
                                ? 'bg-white/5 border-white/10' 
                                : 'bg-blue-500/20 border-blue-400/50'
                            }`}
                            onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-medium">{notification.title}</h4>
                                  {!notification.is_read && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  <span>Type: {notification.type.replace('_', ' ')}</span>
                                  <span>{formatDate(notification.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No notifications found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Analytics Tab */}
        {activeTab === 'analytics' && globalAnalytics && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Global Analytics</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-gray-300 text-sm font-medium">Total Users</h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {formatNumber(globalAnalytics.total_users)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-gray-300 text-sm font-medium">Total Searches</h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {formatNumber(globalAnalytics.total_searches)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-gray-300 text-sm font-medium">Average Searches/User</h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {globalAnalytics.usage_stats.avg_searches_per_user}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-gray-300 text-sm font-medium">Monthly Revenue Potential</h3>
                <p className="text-3xl font-bold text-white mt-2">
                  ${formatNumber(globalAnalytics.subscription_revenue.monthly_potential)}
                </p>
              </div>
            </div>

            {/* Subscription Distribution */}
            {Object.keys(globalAnalytics.active_subscriptions).length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Subscription Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(globalAnalytics.active_subscriptions).map(([plan, count]) => (
                    <div key={plan} className="text-center">
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-gray-300 text-sm capitalize">{plan}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Search Terms */}
            {globalAnalytics.popular_search_terms && globalAnalytics.popular_search_terms.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Popular Search Terms</h3>
                <div className="space-y-2">
                  {globalAnalytics.popular_search_terms.slice(0, 10).map((term, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-white">{term.term}</span>
                      <span className="text-gray-300">{formatNumber(term.count)} searches</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">All Users Overview</h2>
            
            {allUsers.length > 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-gray-300 py-2">User Email</th>
                        <th className="text-gray-300 py-2">Plan</th>
                        <th className="text-gray-300 py-2">Total Searches</th>
                        <th className="text-gray-300 py-2">Companies</th>
                        <th className="text-gray-300 py-2">First Activity</th>
                        <th className="text-gray-300 py-2">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user, index) => (
                        <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                          <td className="text-white py-2">{user.user_id}</td>
                          <td className="text-white py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.subscription_plan === 'enterprise' ? 'bg-purple-500' :
                              user.subscription_plan === 'agency' ? 'bg-blue-500' :
                              user.subscription_plan === 'professional' ? 'bg-green-500' :
                              'bg-gray-500'
                            }`}>
                              {user.subscription_plan || 'Free'}
                            </span>
                          </td>
                          <td className="text-white py-2">{formatNumber(user.total_searches)}</td>
                          <td className="text-white py-2">{formatNumber(user.total_companies)}</td>
                          <td className="text-gray-300 py-2 text-sm">
                            {formatDate(user.first_activity)}
                          </td>
                          <td className="text-gray-300 py-2 text-sm">
                            {formatDate(user.last_activity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <p className="text-gray-300">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;