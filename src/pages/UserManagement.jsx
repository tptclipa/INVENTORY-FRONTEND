import { useState } from 'react';
import Users from './Users';
import ActivityLogs from './ActivityLogs';
import { MdPeople, MdHistory } from 'react-icons/md';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <MdPeople size={20} />
          <span>User Accounts</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <MdHistory size={20} />
          <span>Activity Logs</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'users' && <Users />}
        {activeTab === 'logs' && <ActivityLogs />}
      </div>
    </div>
  );
};

export default UserManagement;
