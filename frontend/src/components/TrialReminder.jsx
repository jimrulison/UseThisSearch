import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Clock, 
  X, 
  Zap, 
  Users, 
  BarChart3, 
  Search,
  Crown,
  ArrowRight
} from 'lucide-react';

const TrialReminder = ({ 
  isOpen, 
  onClose, 
  daysRemaining, 
  onUpgrade 
}) => {
  if (!isOpen) return null;

  const getUrgencyColor = () => {
    if (daysRemaining <= 1) return 'from-red-600 to-red-800';
    if (daysRemaining <= 2) return 'from-orange-600 to-red-600';
    if (daysRemaining <= 3) return 'from-yellow-600 to-orange-600';
    return 'from-blue-600 to-purple-600';
  };

  const getUrgencyMessage = () => {
    if (daysRemaining <= 1) return '🚨 Final Day!';
    if (daysRemaining <= 2) return '⚠️ Almost Gone!';
    if (daysRemaining <= 3) return '⏰ Time Running Out!';
    return '⏰ Trial Ending Soon';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getUrgencyColor()} text-white p-6 relative`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{getUrgencyMessage()}</h2>
              <p className="text-white/90">
                Your free trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Limitations */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Current Trial Limitations:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Only 25 searches per day</li>
              <li>• No access to GROUP KEYWORDS feature</li>
              <li>• Limited to basic features</li>
            </ul>
          </div>

          {/* Upgrade Benefits */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Unlock Full Power with Upgrade:</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Search className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Unlimited Searches</div>
                  <div className="text-sm text-green-600">No more daily limits</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-800">GROUP KEYWORDS</div>
                  <div className="text-sm text-purple-600">AI-powered clustering</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Team Features</div>
                  <div className="text-sm text-blue-600">Collaborate with others</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-800">Advanced Analytics</div>
                  <div className="text-sm text-orange-600">Detailed insights</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Choose Your Plan:</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="font-bold text-blue-600">Professional</div>
                <div className="text-2xl font-bold">$29</div>
                <div className="text-sm text-gray-600">/month</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-500 relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  POPULAR
                </div>
                <div className="font-bold text-green-600">Agency</div>
                <div className="text-2xl font-bold">$79</div>
                <div className="text-sm text-gray-600">/month</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="font-bold text-purple-600">Enterprise</div>
                <div className="text-2xl font-bold">$199</div>
                <div className="text-sm text-gray-600">/month</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
            >
              <Zap className="h-5 w-5 mr-2" />
              Upgrade Now - Keep Your Data
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-3"
            >
              Remind Me Tomorrow
            </Button>
          </div>

          {/* Warning */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              <strong>Don't lose your work!</strong> All your searches and generated content will be saved when you upgrade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialReminder;