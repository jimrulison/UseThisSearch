import React from 'react';
import { Button } from './ui/button';
import { 
  Clock, 
  Search, 
  AlertTriangle,
  CheckCircle,
  Crown
} from 'lucide-react';

const TrialStatus = ({ 
  daysRemaining, 
  searchesUsedToday, 
  searchesRemainingToday,
  onUpgrade,
  isCompact = false 
}) => {
  const getStatusColor = () => {
    if (daysRemaining <= 1) return 'border-red-500 bg-red-50';
    if (daysRemaining <= 3) return 'border-orange-500 bg-orange-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getTextColor = () => {
    if (daysRemaining <= 1) return 'text-red-700';
    if (daysRemaining <= 3) return 'text-orange-700';
    return 'text-blue-700';
  };

  const getSearchesColor = () => {
    if (searchesRemainingToday <= 0) return 'text-red-600';
    if (searchesRemainingToday <= 5) return 'text-orange-600';
    return 'text-green-600';
  };

  if (isCompact) {
    return (
      <div className={`border rounded-lg p-3 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 ${getTextColor()}`} />
            <div>
              <div className={`font-semibold ${getTextColor()}`}>
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
              </div>
              <div className="text-sm text-gray-600">
                {searchesUsedToday}/25 searches today
              </div>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={onUpgrade}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-6 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${daysRemaining <= 1 ? 'bg-red-500' : daysRemaining <= 3 ? 'bg-orange-500' : 'bg-blue-500'}`}>
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${getTextColor()}`}>
              Free Trial - {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Left
            </h3>
            <p className="text-gray-600">
              {daysRemaining <= 1 ? 'Final day!' : 'Time to upgrade soon'}
            </p>
          </div>
        </div>
        
        {daysRemaining <= 3 && (
          <AlertTriangle className={`h-8 w-8 ${daysRemaining <= 1 ? 'text-red-500' : 'text-orange-500'}`} />
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">Daily Searches</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getSearchesColor()}`}>
              {searchesRemainingToday}
            </span>
            <span className="text-gray-600">of 25 remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full ${searchesRemainingToday <= 5 ? 'bg-red-500' : searchesRemainingToday <= 15 ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${(searchesRemainingToday / 25) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">Premium Features</span>
          </div>
          <div className="text-2xl font-bold text-gray-400 mb-1">
            Locked
          </div>
          <div className="text-sm text-gray-600">
            GROUP KEYWORDS & more
          </div>
        </div>
      </div>

      {/* Trial Limitations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-yellow-800 mb-2">Trial Limitations:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 25 searches per day maximum</li>
          <li>• No access to GROUP KEYWORDS feature</li>
          <li>• Basic features only</li>
        </ul>
      </div>

      {/* What You Get When You Upgrade */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-green-800 mb-2">Upgrade to Get:</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Unlimited daily searches
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            GROUP KEYWORDS access
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Team collaboration
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Advanced analytics
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button 
        onClick={onUpgrade}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
        size="lg"
      >
        <Crown className="h-5 w-5 mr-2" />
        Upgrade Now - Keep Your Data & Remove Limits
      </Button>

      {/* Fine Print */}
      <p className="text-xs text-gray-500 text-center mt-3">
        All your searches and generated content will be preserved when you upgrade
      </p>
    </div>
  );
};

export default TrialStatus;