import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { BoltBadge } from './components/ui/bolt-badge';
import { supabase } from './lib/supabase';
import { useAuthStore } from './lib/store';

// Layout Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PromoBanner } from './components/ui/promo-banner';

// Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Orders } from './pages/Orders';
import { Search } from './pages/Search';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { Categories } from './pages/Categories';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Welcome } from './pages/onboarding/Welcome';
import { StoreSetup } from './pages/onboarding/StoreSetup';
import { PaymentSetup } from './pages/onboarding/PaymentSetup';
import { ProductsSetup } from './pages/onboarding/ProductsSetup';
import { FinalSetup } from './pages/onboarding/FinalSetup';
import { OnboardingHeader } from './components/layout/OnboardingHeader';
import { toast } from 'sonner';

// Admin Components
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Products as AdminProducts } from './pages/admin/Products';
import { Discounts } from './pages/admin/Discounts';
import { ProductReviews } from './pages/admin/ProductReviews';
import { Orders as AdminOrders } from './pages/admin/Orders';
import { Customers } from './pages/admin/Customers';
import { Categories as AdminCategories } from './pages/admin/Categories';
import { Analytics } from './pages/admin/Analytics';
import { PaymentProcessors } from './pages/admin/PaymentProcessors';
import { WebhookEvents } from './pages/admin/WebhookEvents';
import { PaymentTransactions } from './pages/admin/PaymentTransactions';
import { AddPaymentProcessor } from './pages/admin/AddPaymentProcessor';
import { EditPaymentProcessor } from './pages/admin/EditPaymentProcessor';
import { Settings } from './pages/admin/Settings';
import { AddProduct } from './pages/admin/AddProduct';
import { EditProduct } from './pages/admin/EditProduct';

// Global onboarding redirect component
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, setUser } = useAuthStore();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  console.log('🔍 OnboardingGuard: Checking for user', user?.email, 'with role', user?.role);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // If no user, allow access
      if (!user) {
        console.log('🟢 No user logged in, allowing access');
        setOnboardingCompleted(true);
        setLoading(false);
        return;
      }

      // Check if user.id is valid before making database queries
      if (!user.id) {
        console.log('⚠️ User ID is undefined, allowing access with customer role');
        setOnboardingCompleted(true);
        setLoading(false);
        return;
      }


      // Fetch the user's actual role from the database
      try {
        console.log('🔍 Fetching user role from database for:', user.email);
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Keep existing role if error
        } else {
          console.log('👤 User role from database:', profile.role);
          
          // Update the auth store with the correct role if it's different
          if (user.role !== profile.role) {
            console.log('🔄 Updating user role in auth store from', user.role, 'to', profile.role);
            setUser({
              ...user,
              role: profile.role
            });
          }
        }
      } catch (error) {
        console.error('Error in user role check:', error);
      }

      // If user is not admin, allow access
      const userRole = user.role; // Use the role from auth store (now updated)
      if (userRole !== 'admin') {
        console.log('🟢 User is not admin (role:', userRole, '), allowing access');
        setOnboardingCompleted(true);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Checking onboarding status for admin user:', user.email);
        console.log('🔍 Checking onboarding status for admin user:', user.email, 'with role:', userRole);
        const { data: onboardingStatus } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'onboarding_completed')
          .single();

        console.log('📊 Onboarding status from DB:', onboardingStatus);
        
        const isCompleted = onboardingStatus?.value === true;
        console.log('✅ Is onboarding completed?', isCompleted);
        setOnboardingCompleted(isCompleted);
      } catch (error) {
        console.error('Could not check onboarding status:', error);
        // If we can't check, assume onboarding is needed for safety
        console.log('⚠️ Error checking onboarding, assuming incomplete');
        toast.error('Error checking onboarding status');
        setOnboardingCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, setUser]);

  // Show loading while checking onboarding status
  if (loading) {
    console.log('⏳ Loading onboarding status...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Checking setup...</p>
        </div>
      </div>
    );
  }

  // Get current user role from auth store (now properly synchronized)
  const userRole = user?.role || 'customer';

  // GLOBAL REDIRECT: If admin user and onboarding not completed, redirect to onboarding
  // This applies to EVERY page in the app except onboarding pages themselves
  if (user && userRole === 'admin' && onboardingCompleted === false && !location.pathname.startsWith('/onboarding')) {
    console.log('🚨 GLOBAL REDIRECT: Admin user needs onboarding! Redirecting from', location.pathname, 'to /onboarding');
    toast.info('Please complete the store setup first');
    return <Navigate to="/onboarding" replace />;
  }

  console.log('🟢 Allowing access to:', location.pathname, '(User role:', userRole, ', Onboarding:', onboardingCompleted, ')');
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  
  return (
    <div className="min-h-screen flex flex-col">
      {isOnboarding ? (
        <>
          <OnboardingHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/onboarding" element={<Welcome />} />
              <Route path="/onboarding/store" element={<StoreSetup />} />
              <Route path="/onboarding/payment" element={<PaymentSetup />} />
              <Route path="/onboarding/products" element={<ProductsSetup />} />
              <Route path="/onboarding/design" element={<DesignSetup />} />
              <Route path="/onboarding/final" element={<FinalSetup />} />
            </Routes>
          </main>
        </>
      ) : (
        <>
          <PromoBanner />
          <Header />
          
          <main className="flex-1">
            <Routes>
              {/* Auth routes - always accessible */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* All other routes - protected by OnboardingGuard */}
              <Route path="/" element={
                <Home />
              } />
              <Route path="/products" element={
                <Products />
              } />
              <Route path="/product/:slug" element={
                <OnboardingGuard>
                  <ProductDetail />
                </OnboardingGuard>
              } />
              <Route path="/cart" element={
                <OnboardingGuard>
                  <Cart />
                </OnboardingGuard>
              } />
              <Route path="/wishlist" element={
                <OnboardingGuard>
                  <Wishlist />
                </OnboardingGuard>
              } />
              <Route path="/checkout" element={
                <OnboardingGuard>
                  <Checkout />
                </OnboardingGuard>
              } />
              <Route path="/order-confirmation/:orderId" element={
                <OnboardingGuard>
                  <OrderConfirmation />
                </OnboardingGuard>
              } />
              <Route path="/orders" element={
                <OnboardingGuard>
                  <Orders />
                </OnboardingGuard>
              } />
              <Route path="/search" element={
                <OnboardingGuard>
                  <Search />
                </OnboardingGuard>
              } />
              <Route path="/contact" element={
                <OnboardingGuard>
                  <Contact />
                </OnboardingGuard>
              } />
              <Route path="/about" element={
                <OnboardingGuard>
                  <About />
                </OnboardingGuard>
              } />
              <Route path="/categories" element={
                <OnboardingGuard>
                  <Categories />
                </OnboardingGuard>
              } />
              <Route path="/order/:orderId" element={
                <OnboardingGuard>
                  <OrderConfirmation />
                </OnboardingGuard>
              } />
              
              {/* Admin routes */}
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AddProduct />} />
                <Route path="products/:productId/edit" element={<EditProduct />} />
                <Route path="discounts" element={<Discounts />} />
                <Route path="reviews" element={<ProductReviews />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<Customers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="payment-processors" element={<PaymentProcessors />} />
                <Route path="payment-processors/new" element={<AddPaymentProcessor />} />
                <Route path="payment-processors/:processorId/edit" element={<EditPaymentProcessor />} />
                <Route path="webhooks" element={<WebhookEvents />} />
                <Route path="transactions" element={<PaymentTransactions />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </main>
          
          <Footer />
        </>
      )}
      <BoltBadge />
      <Toaster richColors position="top-center" />
    </div>
  );
}

function App() {
  const { setUser, setLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the current session quickly
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (mounted) {
          if (session?.user) {
            // Use auth user data directly - no database query needed
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'customer', // Default role, will be updated by background fetch
            });

            // Fetch detailed profile in background (non-blocking)
            fetchUserProfileBackground(session.user.id);
          } else {
            setUser(null);
          }
          
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Background profile fetch (non-blocking)
    const fetchUserProfileBackground = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (!error && profile && mounted) {
          // Update user with correct role
          setUser(prev => prev ? { ...prev, role: profile.role } : null);
        }
      } catch (error) {
        // Silently fail - user can still use the app with default role
        console.warn('Background profile fetch failed:', error);
      }
    };

    // Initialize immediately
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'customer',
              });
              // Fetch detailed profile in background
              fetchUserProfileBackground(session.user.id);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'customer',
              });
              fetchUserProfileBackground(session.user.id);
            }
            break;
        }

        if (!isInitialized) {
          setIsInitialized(true);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, isInitialized]);

  // Show minimal loading only for initial auth check
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <OnboardingGuard>
        <AppContent />
      </OnboardingGuard>
    </Router>
  );
}

export default App;