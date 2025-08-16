import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail,
  X,
  Send,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import axios from 'axios';

const SupportCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('faq');
  const [faqItems, setFaqItems] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    category: 'Software Issue',
    subject: '',
    description: ''
  });
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (isOpen) {
      loadSupportData();
    }
  }, [isOpen]);

  const loadSupportData = async () => {
    try {
      // Load FAQ items
      await loadFAQItems();
      // Load chat messages  
      await loadChatMessages();
      // Load user tickets
      await loadUserTickets();
      // Load user data
      loadUserData();
    } catch (error) {
      console.error('Error loading support data:', error);
    }
  };

  const loadFAQItems = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/support/faq`);
      if (response.data && response.data.length > 0) {
        setFaqItems(response.data);
      } else {
        // Use default FAQ if none exist in backend
        setFaqItems(defaultFAQ);
      }
    } catch (error) {
      console.error('Error loading FAQ:', error);
      // Fall back to default FAQ
      setFaqItems(defaultFAQ);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/support/chat/messages?limit=50`);
      setChatMessages(response.data || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      setChatMessages([]);
    }
  };

  const loadUserTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${backendUrl}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserTickets(response.data || []);
    } catch (error) {
      console.error('Error loading user tickets:', error);
      setUserTickets([]);
    }
  };
    {
      id: '1',
      question: 'How do I perform my first keyword search?',
      answer: 'To perform your first search: 1) Type your target keyword in the search box (e.g., "digital marketing"), 2) Click "Generate Ideas" or press Enter, 3) Wait 10-30 seconds for AI processing, 4) View your 40+ keyword suggestions in 4 categories.',
      category: 'Getting Started'
    },
    {
      id: '2',
      question: 'What are the different result categories?',
      answer: 'Results are organized into 4 categories: Questions (user questions about your topic), Prepositions (keywords with relationships), Comparisons (alternative searches), and Alphabetical (comprehensive related terms). Each category helps with different content strategies.',
      category: 'Search Results'
    },
    {
      id: '3',
      question: 'How do I use the content generation tools?',
      answer: 'After performing a search, click any of the 6 content tools: Blog Titles, Meta Descriptions, Social Media Posts, FAQ Generator, Content Brief Templates, or Hashtag Generator. Select relevant keywords from your results and click "Generate" to create content.',
      category: 'Content Creation'
    },
    {
      id: '4',
      question: 'How do I upgrade my subscription plan?',
      answer: 'Click the "UPGRADE" button in the top navigation. Review the plan comparison, select your desired tier (Professional, Agency, or Enterprise), and complete the secure payment process. Your new limits take effect immediately.',
      category: 'Billing'
    },
    {
      id: '5',
      question: 'How do I add team members?',
      answer: 'From your dashboard, access team management. Click "Invite Team Member", enter their email address, select their role (Owner, Admin, or Member), and send the invitation. They\'ll receive an email to join your workspace.',
      category: 'Team Management'
    },
    {
      id: '6',
      question: 'What does "Team full" mean?',
      answer: 'This means you\'ve reached your plan\'s user limit. Solo plans support 1 user, Professional plans support 2 users, Agency plans support 5 users, and Enterprise supports 7 users. Upgrade your plan to add more team members.',
      category: 'Team Management'
    },
    {
      id: '7',
      question: 'How do I export my search results?',
      answer: 'After completing a search, click the "Export CSV" button. This downloads all keyword suggestions organized by category in a spreadsheet-compatible format. Files are named with your keyword and date for easy organization.',
      category: 'Data Export'
    },
    {
      id: '8',
      question: 'Can I manage multiple companies/projects?',
      answer: 'Yes! Use the Company Selector dropdown to switch between workspaces. Professional plans support 5 companies, while Agency and Enterprise plans support unlimited companies. Each company has separate data and analytics.',
      category: 'Company Management'
    },
    {
      id: '9',
      question: 'How do I access the GROUP KEYWORDS feature?',
      answer: 'GROUP KEYWORDS is available exclusively for annual subscription holders. If you have an annual plan, you\'ll see the feature on your main search page. It uses AI to organize related keywords into strategic content groups.',
      category: 'Premium Features'
    },
    {
      id: '10',
      question: 'Where can I view my usage statistics?',
      answer: 'Click the "Dashboard" button to view your analytics including total searches used, popular terms, recent activity, and team performance. You can also see your usage limits and remaining allowance.',
      category: 'Analytics'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setFaqItems(defaultFAQ);
      // Load user data when opening support
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = () => {
    // Get user info from auth context or localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setSupportForm(prev => ({
      ...prev,
      name: user.name || user.email || '',
      email: user.email || ''
    }));
  };

  const categorizesFAQ = () => {
    const categories = {};
    faqItems.forEach(item => {
      const category = item.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    return categories;
  };

  const handleSendChatMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    try {
      // Add message to local state immediately for better UX
      const userMessage = {
        id: Date.now(),
        user_email: supportForm.email,
        user_name: supportForm.name,
        message: newMessage,
        is_admin: false,
        created_at: new Date(),
        replies: []
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      
      // Here you would make an API call to send the message
      // await sendChatMessage(newMessage);
      
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Add current date/time
      const ticketData = {
        ...supportForm,
        created_at: new Date(),
        status: 'open'
      };
      
      // Add to local tickets for demo
      const newTicket = {
        id: Date.now(),
        ...ticketData
      };
      
      setUserTickets(prev => [newTicket, ...prev]);
      
      // Reset form
      setSupportForm({
        name: supportForm.name,
        email: supportForm.email,
        category: 'Software Issue',
        subject: '',
        description: ''
      });
      
      alert('Support ticket submitted successfully! We\'ll get back to you soon.');
      
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      alert('Error submitting ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Support Center
            </h2>
            <p className="text-blue-100 mt-1">Get help, connect with users, and contact support</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Common Questions
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                User Chat
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Support
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="mt-6">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Frequently Asked Questions</h3>
                  <p className="text-gray-600">Find quick answers to common questions about using the platform</p>
                </div>

                {Object.entries(categorizesFAQ()).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">{category}</h4>
                    <div className="space-y-3 mb-6">
                      {items.map((item) => (
                        <Card key={item.id} className="border border-gray-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-gray-800 flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              {item.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-gray-600 text-sm leading-relaxed pl-6">{item.answer}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* User Chat Tab */}
            <TabsContent value="chat" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Community Discussion</h3>
                  <p className="text-gray-600">Connect with other users, share tips, and get updates from our team</p>
                </div>

                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-16">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.is_admin 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {message.is_admin ? 'Support Team' : message.user_name}
                            </span>
                            <span className="text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendChatMessage}
                    disabled={isLoading || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Support Email Tab */}
            <TabsContent value="support" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Support</h3>
                  <p className="text-gray-600">Submit a support request and we'll get back to you promptly</p>
                </div>

                {/* Support Tickets List */}
                {userTickets.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Your Support Tickets</h4>
                    <div className="space-y-2">
                      {userTickets.slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{ticket.subject}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Support Form */}
                <form onSubmit={handleSupportFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={supportForm.name}
                        onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
                    <select
                      value={supportForm.category}
                      onChange={(e) => setSupportForm({...supportForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Billing">Billing</option>
                      <option value="Software Issue">Software Issue</option>
                      <option value="Training Help">Training Help</option>
                      <option value="Suggestions">Suggestions</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief description of your issue"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                      value={supportForm.description}
                      onChange={(e) => setSupportForm({...supportForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted: {new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Submit Support Request
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;