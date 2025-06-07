import React from 'react';
import { Briefcase } from 'lucide-react';

const HRs = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending HR Approvals</h3>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h4 className="font-semibold text-gray-900">Google Inc.</h4>
              <p className="text-sm text-gray-600">HR Access Request</p>
              <p className="text-xs text-gray-500">Submitted 1 day ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Approve
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRs;
