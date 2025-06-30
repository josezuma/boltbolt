import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Store, CreditCard, Package, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
  path: string;
}

export function Welcome() {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Double-check user role from database
    const verifyAdminAndCheckOnboarding = async () => {
      try {
        console.log('🔍 Welcome: Verifying admin role for user:', user.email);
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error verifying admin role:', error);
          navigate('/');
          return;
        }
        
        if (data.role !== 'admin') {
          console.log('⚠️ Welcome: User is not an admin in database. Redirecting to home');
          navigate('/');
          return;
        }
        
        console.log('✅ Welcome: Admin role confirmed from database');
        // Update local state if needed
        if (user.role !== 'admin') {
          console.log('🔄 Welcome: Updating local user role to admin');
          // This is a workaround - ideally we'd use updateUserRole from the store
          setUser({
            ...user,
            role: 'admin'
          });
        }
        
        // Continue with onboarding check
        checkOnboardingStatus();
      } catch (error) {
        console.error('Error in admin verification:', error);
        navigate('/');
      }
    };
    
    // If user claims to be admin, verify it; otherwise redirect
    if (user.role === 'admin') {
      verifyAdminAndCheckOnboarding();
    } else {
      console.log('⚠️ Welcome: User is not admin in local state. Redirecting to home');
      navigate('/');
    }
  }, [user, navigate]);

  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Welcome page: Checking onboarding status...');
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'onboarding_completed',
          'store_configured',
          'payment_configured',
          'products_added',
          'design_configured',
          'setup_step'
        ]);

      const settingsMap = settings?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>) || {};

      console.log('📊 All onboarding settings:', settingsMap);

      // If onboarding is already completed, redirect to dashboard
      if (settingsMap.onboarding_completed === true) {
        console.log('✅ Onboarding already completed, redirecting to home');
        navigate('/admin/dashboard');
        return;
      }
      
      console.log('❌ Onboarding not completed, showing welcome page');

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'store',
          title: 'Store Information',
          description: 'Set up your store name, description, and basic details',
          icon: <Store className="w-6 h-6" />,
          completed: settingsMap.store_configured === true,
          required: true,
          path: '/onboarding/store'
        },
        {
          id: 'payment',
          title: 'Payment Setup',
          description: 'Configure Stripe and other payment processors',
          icon: <CreditCard className="w-6 h-6" />,
          completed: settingsMap.payment_configured === true,
          required: true,
          path: '/onboarding/payment'
        }
      ];

      setSteps(onboardingSteps);
      setCurrentStep(parseInt(settingsMap.setup_step) || 0);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      console.log('⚠️ Error in Welcome page, assuming onboarding needed');
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const handleStepClick = (stepIndex: number) => {
    const step = steps[stepIndex];
    navigate(step.path);
  };

  const handleSkipOnboarding = async () => {
    try {
      console.log('⏭️ Skipping onboarding, marking as completed');
      await supabase
        .from('settings')
        .upsert([
          { key: 'onboarding_completed', value: true },
          { key: 'setup_step', value: steps.length }
        ]);
      
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  // Debug function to reset onboarding (only for development)
  const handleResetOnboarding = async () => {
    try {
      console.log('🔄 Resetting onboarding status');
      await supabase
        .from('settings')
        .upsert([
          { key: 'onboarding_completed', value: false },
          { key: 'setup_step', value: 0 }
        ]);
      
      window.location.reload();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to BoltShop!</h1>
            <p className="text-xl text-gray-600 mb-6">
              Let's set up your e-commerce store in just a few steps
            </p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{completedSteps} of {steps.length} completed</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {steps.map((step, index) => (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  step.completed 
                    ? 'border-green-200 bg-green-50' 
                    : index === currentStep 
                    ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-200' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handleStepClick(index)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${
                      step.completed 
                        ? 'bg-green-100 text-green-600' 
                        : index === currentStep 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.completed ? <CheckCircle className="w-6 h-6" /> : step.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      {step.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                      {step.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button
              onClick={() => {
                const nextIncompleteStep = steps.findIndex(step => !step.completed);
                if (nextIncompleteStep !== -1) {
                  handleStepClick(nextIncompleteStep);
                } else {
                  handleStepClick(0);
                }
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              {completedSteps === 0 ? 'Get Started' : 'Continue Setup'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSkipOnboarding}
              size="lg"
              className="px-8 py-3"
            >
              Skip Setup for Now
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Don't worry, you can always change these settings later in your admin dashboard.
            </p>
            
            {/* Debug button - remove in production */}
            <div className="mt-4">
              <button
                onClick={handleResetOnboarding}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                [Debug] Reset Onboarding
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}