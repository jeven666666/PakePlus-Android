import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  HardDrive,
  Activity,
  Settings,
  ArrowLeft,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import { showToast } from '../components/ui/Toast';

function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tasks'>('dashboard');

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="h-screen bg-agnes-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-agnes-card border-r border-agnes-border flex flex-col">
        <div className="p-6 border-b border-agnes-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-agnes-purple to-agnes-cyan flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold gradient-text">管理后台</div>
              <div className="text-xs text-agnes-text-muted">Agnes AI Studio</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-agnes-purple/20 text-agnes-purple'
                : 'text-agnes-text-secondary hover:bg-white/5'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>仪表板</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-agnes-purple/20 text-agnes-purple'
                : 'text-agnes-text-secondary hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>用户管理</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'tasks'
                ? 'bg-agnes-purple/20 text-agnes-purple'
                : 'text-agnes-text-secondary hover:bg-white/5'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>任务管理</span>
          </button>
        </nav>

        <div className="p-4 border-t border-agnes-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-agnes-text-secondary hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回工作台</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <DashboardContent stats={stats} loading={loading} />
          )}
          {activeTab === 'users' && <UsersContent />}
          {activeTab === 'tasks' && <TasksContent />}
        </div>
      </div>
    </div>
  );
}

function DashboardContent({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-agnes-purple/30 border-t-agnes-purple rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: '总用户数',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      subtitle: `活跃 ${stats?.users?.active || 0} 人`,
    },
    {
      title: '付费用户',
      value: stats?.users?.paid || 0,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      subtitle: `占比 ${
        stats?.users?.total ? Math.round((stats.users.paid / stats.users.total) * 100) : 0
      }%`,
    },
    {
      title: '总任务数',
      value: stats?.tasks?.total || 0,
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      subtitle: `成功 ${stats?.tasks?.success || 0} 次`,
    },
    {
      title: '存储使用',
      value: `${(stats?.storage?.totalUsed || 0).toFixed(2)} GB`,
      icon: HardDrive,
      color: 'from-orange-500 to-amber-500',
      subtitle: `剩余积分 ${stats?.storage?.totalCreditsRemaining || 0}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text">仪表板</h1>
        <p className="text-agnes-text-muted mt-1">平台运营数据概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="glass-strong rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-agnes-text-muted text-sm">{card.title}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
                <p className="text-agnes-text-secondary text-sm mt-1">{card.subtitle}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-strong rounded-xl p-6">
          <h3 className="font-semibold mb-4">今日数据</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-agnes-text-secondary">新增用户</span>
              <span className="font-bold text-agnes-text-primary">{stats?.users?.newToday || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-agnes-text-secondary">新增任务</span>
              <span className="font-bold text-agnes-text-primary">{stats?.tasks?.newToday || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-agnes-text-secondary">今日消费</span>
              <span className="font-bold text-agnes-cyan">{stats?.tasks?.creditsSpent || 0} 积分</span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-6">
          <h3 className="font-semibold mb-4">任务状态</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-agnes-text-secondary flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                成功
              </span>
              <span className="font-bold text-green-400">{stats?.tasks?.success || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-agnes-text-secondary flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                失败
              </span>
              <span className="font-bold text-red-400">{stats?.tasks?.failed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-agnes-text-secondary flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                处理中
              </span>
              <span className="font-bold text-yellow-400">
                {(stats?.tasks?.total || 0) - (stats?.tasks?.success || 0) - (stats?.tasks?.failed || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [search, statusFilter]);

  const handleViewUser = async (userId: string) => {
    try {
      const res = await api.getUser(userId);
      if (res.data) {
        setSelectedUser(res.data);
        setShowUserDetail(true);
      }
    } catch (err) {
      showToast('error', '获取用户信息失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">用户管理</h1>
          <p className="text-agnes-text-muted mt-1">管理平台所有用户</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-strong rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-agnes-text-muted" />
          <input
            type="text"
            placeholder="搜索用户邮箱或昵称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-agnes-text-primary placeholder:text-agnes-text-muted w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-agnes-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-agnes-bg border border-agnes-border rounded-lg px-3 py-2 text-sm text-agnes-text-primary outline-none"
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">禁用</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-strong rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">用户</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">角色</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">会员</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">积分</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">状态</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-agnes-text-muted">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-agnes-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-agnes-purple/30 border-t-agnes-purple rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-agnes-purple to-agnes-cyan flex items-center justify-center text-sm font-bold">
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-agnes-text-primary">{user.displayName}</div>
                          <div className="text-sm text-agnes-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'superadmin'
                            ? 'bg-red-500/20 text-red-400'
                            : user.role === 'admin'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.role === 'superadmin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-agnes-text-secondary">
                      {user.membership === 'enterprise' ? (
                        <span className="text-agnes-purple font-medium">企业版</span>
                      ) : user.membership === 'pro' ? (
                        <span className="text-agnes-cyan font-medium">专业版</span>
                      ) : (
                        <span className="text-agnes-text-muted">免费版</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-agnes-text-primary font-medium">{user.credits}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {user.isActive ? '活跃' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="text-agnes-text-secondary hover:text-agnes-purple transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-agnes-border">
            <div className="text-sm text-agnes-text-muted">
              共 {pagination.total} 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="text-agnes-text-muted text-sm">
                第 {pagination.page} / {pagination.pages} 页
              </span>
              <button
                onClick={() => loadUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 rounded text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
            loadUsers(pagination.page);
          }}
        />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditDesc, setCreditDesc] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSave = async () => {
    try {
      setProcessing(true);
      const res = await api.updateUser(user.user.id, editData);
      if (res.data) {
        showToast('success', '用户信息已更新');
        setEditing(false);
      }
    } catch (err) {
      showToast('error', '更新失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddCredits = async () => {
    if (!creditAmount) return;
    try {
      setProcessing(true);
      const res = await api.addUserCredits(user.user.id, creditAmount, creditDesc);
      if (res.data) {
        showToast('success', creditAmount > 0 ? '积分已添加' : '积分已扣除');
        setCreditAmount(0);
        setCreditDesc('');
        user.user.credits = res.data.newCredits;
      }
    } catch (err) {
      showToast('error', '操作失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此用户吗？此操作不可撤销！')) return;
    try {
      setProcessing(true);
      const res = await api.deleteUser(user.user.id);
      if (res.data) {
        showToast('success', '用户已删除');
        onClose();
      }
    } catch (err) {
      showToast('error', '删除失败');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto glass-strong rounded-2xl">
        <div className="p-6 border-b border-agnes-border flex items-center justify-between">
          <h2 className="text-xl font-bold">用户详情</h2>
          <button onClick={onClose} className="text-agnes-text-muted hover:text-agnes-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-agnes-purple to-agnes-cyan flex items-center justify-center text-2xl font-bold">
              {user.user.displayName?.[0]?.toUpperCase() || user.user.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.user.displayName}</h3>
              <p className="text-agnes-text-muted">{user.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    user.user.role === 'superadmin'
                      ? 'bg-red-500/20 text-red-400'
                      : user.user.role === 'admin'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {user.user.role === 'superadmin' ? '超级管理员' : user.user.role === 'admin' ? '管理员' : '普通用户'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    user.user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {user.user.isActive ? '活跃' : '禁用'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-agnes-text-muted mb-1">总任务</p>
              <p className="text-2xl font-bold">{user.stats.tasks.total}</p>
              <p className="text-xs text-agnes-text-muted mt-1">
                成功 {user.stats.tasks.success} / 失败 {user.stats.tasks.failed}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-agnes-text-muted mb-1">总消费</p>
              <p className="text-2xl font-bold text-agnes-cyan">{user.stats.tasks.creditsSpent}</p>
              <p className="text-xs text-agnes-text-muted mt-1">积分</p>
            </div>
          </div>

          {/* Edit Form */}
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-agnes-text-muted mb-2">昵称</label>
                <input
                  type="text"
                  value={editData.displayName ?? user.user.displayName}
                  onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                  className="w-full bg-agnes-bg border border-agnes-border rounded-lg px-4 py-2 text-agnes-text-primary outline-none focus:border-agnes-purple"
                />
              </div>
              <div>
                <label className="block text-sm text-agnes-text-muted mb-2">角色</label>
                <select
                  value={editData.role ?? user.user.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full bg-agnes-bg border border-agnes-border rounded-lg px-4 py-2 text-agnes-text-primary outline-none focus:border-agnes-purple"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                  <option value="superadmin">超级管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-agnes-text-muted mb-2">会员</label>
                <select
                  value={editData.membership ?? user.user.membership}
                  onChange={(e) => setEditData({ ...editData, membership: e.target.value })}
                  className="w-full bg-agnes-bg border border-agnes-border rounded-lg px-4 py-2 text-agnes-text-primary outline-none focus:border-agnes-purple"
                >
                  <option value="free">免费版</option>
                  <option value="pro">专业版</option>
                  <option value="enterprise">企业版</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-agnes-text-muted mb-2">积分</label>
                <input
                  type="number"
                  value={editData.credits ?? user.user.credits}
                  onChange={(e) => setEditData({ ...editData, credits: parseInt(e.target.value) || 0 })}
                  className="w-full bg-agnes-bg border border-agnes-border rounded-lg px-4 py-2 text-agnes-text-primary outline-none focus:border-agnes-purple"
                />
              </div>
              <div>
                <label className="block text-sm text-agnes-text-muted mb-2">状态</label>
                <select
                  value={editData.isActive ?? user.user.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'active' })}
                  className="w-full bg-agnes-bg border border-agnes-border rounded-lg px-4 py-2 text-agnes-text-primary outline-none focus:border-agnes-purple"
                >
                  <option value="active">活跃</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={processing}
                  className="flex-1 py-2 rounded-lg gradient-primary text-white font-medium disabled:opacity-50"
                >
                  {processing ? '保存中...' : '保存更改'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditData({});
                  }}
                  className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">当前积分</p>
                    <p className="text-2xl font-bold text-agnes-purple">{user.user.credits}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                      placeholder="积分数量"
                      className="w-24 bg-agnes-bg border border-agnes-border rounded-lg px-3 py-2 text-center text-agnes-text-primary outline-none"
                    />
                    <input
                      type="text"
                      value={creditDesc}
                      onChange={(e) => setCreditDesc(e.target.value)}
                      placeholder="备注"
                      className="w-32 bg-agnes-bg border border-agnes-border rounded-lg px-3 py-2 text-agnes-text-primary outline-none"
                    />
                    <button
                      onClick={handleAddCredits}
                      disabled={!creditAmount || processing}
                      className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-50"
                    >
                      {creditAmount > 0 ? '添加' : '扣除'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    编辑用户
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={processing}
                    className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksContent() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getAdminTasks({
        page,
        limit: 20,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      if (res.data) {
        setTasks(res.data.tasks);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(1);
  }, [statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'running':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'failed':
        return '失败';
      case 'running':
        return '运行中';
      case 'pending':
        return '等待中';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'chat':
        return '💬';
      case 'tts':
        return '🎵';
      case 'editor':
        return '✂️';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">任务管理</h1>
        <p className="text-agnes-text-muted mt-1">查看和管理所有用户任务</p>
      </div>

      {/* Filters */}
      <div className="glass-strong rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-agnes-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-agnes-bg border border-agnes-border rounded-lg px-3 py-2 text-sm text-agnes-text-primary outline-none"
          >
            <option value="">全部状态</option>
            <option value="pending">等待中</option>
            <option value="running">运行中</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-agnes-bg border border-agnes-border rounded-lg px-3 py-2 text-sm text-agnes-text-primary outline-none"
          >
            <option value="">全部类型</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="chat">对话</option>
            <option value="tts">语音</option>
            <option value="editor">编辑</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="glass-strong rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">用户</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">类型</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">提示词</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">消费</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-agnes-text-muted">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-agnes-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-agnes-purple/30 border-t-agnes-purple rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-agnes-text-muted font-mono text-sm">
                      {task.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-agnes-text-primary">{task.userName}</div>
                        <div className="text-xs text-agnes-text-muted">{task.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-2xl">{getTypeIcon(task.type)}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-agnes-text-secondary truncate" title={task.prompt}>
                        {task.prompt || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-agnes-text-primary">{task.creditsCost || 0}</td>
                    <td className="px-6 py-4 text-agnes-text-muted text-sm">
                      {new Date(task.createdAt * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-agnes-border">
            <div className="text-sm text-agnes-text-muted">
              共 {pagination.total} 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadTasks(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="text-agnes-text-muted text-sm">
                第 {pagination.page} / {pagination.pages} 页
              </span>
              <button
                onClick={() => loadTasks(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 rounded text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
