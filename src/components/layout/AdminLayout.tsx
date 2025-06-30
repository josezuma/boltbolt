import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  FolderOpen, 
  MessageSquare,
  LogOut,
  Menu,
  X,
  Settings,
  CreditCard,
  Webhook,
  DollarSign,
  Tag
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Discounts', href: '/admin/discounts', icon: Tag },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Payment Processors', href: '/admin/payment-processors', icon: CreditCard },
  { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
  { name: 'Transactions', href: '/admin/transactions', icon: DollarSign },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const { user, setUser } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  useEffect(() => {
    console.log('🔍 AdminLayout: Initializing...');
    const checkOnboardingStatus = async () => {
      // First, ensure we have a user and they claim to be an admin
      if (!user || user.role !== 'admin') {
        console.log('⚠️ AdminLayout: No user or not admin in local state:', user?.email, user?.role);
        setLoading(false); 
        return;
      }
      
      // Double-check user role from database to be sure
      setIsCheckingRole(true);
      try {
        console.log('🔍 AdminLayout: Verifying admin role for user:', user.email);
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user role:', error);
          setLoading(false);
          setIsCheckingRole(false);
          return;
        }
        
        // If not admin, don't proceed with onboarding check
        if (profile.role !== 'admin') {
          console.log('⚠️ AdminLayout: User is not admin in database. DB role:', profile.role);
          setLoading(false);
          setIsCheckingRole(false);
          return;
        } else {
          console.log('✅ AdminLayout: Admin role confirmed from database');
          // Update local state if needed
          if (user.role !== 'admin') {
            console.log('🔄 AdminLayout: Updating local role to admin');
            setUser({
              ...user,
              role: 'admin'
            });
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
        setIsCheckingRole(false);
        return;
      }
      setIsCheckingRole(false);
      
      // If we get here, user is confirmed admin
      try {
        console.log('🔍 AdminLayout: Checking onboarding status...');
        const { data: onboardingStatus, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'onboarding_completed')
          .single();

        if (error) {
          console.error('Error checking onboarding status in AdminLayout:', error);
          console.error('Error checking onboarding status:', error);
          setOnboardingCompleted(false);
        } else {
          console.log('📊 Onboarding status from DB:', onboardingStatus);
          setOnboardingCompleted(onboardingStatus?.value === true);
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
        setOnboardingCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    console.log('🔄 AdminLayout: Running onboarding check...');
    checkOnboardingStatus();
  }, [user]);

  // Show loading state while checking role or onboarding status
  if (loading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  // Check if user is admin
  if (!user) {
    console.log('⛔ AdminLayout: No user logged in, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'admin') {
    console.log(`⛔ AdminLayout: User ${user.email} has role ${user.role}, not admin. Redirecting to home`);
    return <Navigate to="/" state={{ message: "You don't have admin access" }} replace />;
  }

  // Redirect to onboarding if not completed
  if (onboardingCompleted === false) {
    console.log('🚀 AdminLayout: Onboarding not completed, redirecting to onboarding flow');
    return <Navigate to="/onboarding" replace />;
  }
  
  console.log('✅ AdminLayout: Rendering admin layout with onboarding completed');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Account
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-600 px-3 py-1">
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, Admin
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}