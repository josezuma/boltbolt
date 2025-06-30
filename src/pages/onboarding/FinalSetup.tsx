import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Rocket, Store, CreditCard, Package, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface SetupStatus {
  store_configured: boolean;
  payment_configured: boolean;
  products_added: boolean;
}

export function FinalSetup() {
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    store_configured: false,
    payment_configured: false,
    products_added: false,
    design_configured: false
  });

  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/');
      return;
    }
    
    loadSetupStatus();
  }, [user, isAdmin, navigate]);

  const loadSetupStatus = async () => {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'store_configured',
          'payment_configured',
          'products_added',
        ]);

      if (settings) {
        const statusMap = settings.reduce((acc, setting) => {
          acc[setting.key as keyof SetupStatus] = setting.value === true;
          return acc;
        }, {} as SetupStatus);

        setSetupStatus(statusMap);
      }
    } catch (error) {
      console.error('Error loading setup status:', error);
    }
  };

  const completedSteps = Object.values(setupStatus).filter(Boolean).length;
  const totalSteps = Object.keys(setupStatus).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const setupSteps = [
    {
      key: 'store_configured' as keyof SetupStatus,
      title: 'Store Information',
      description: 'Basic store details and contact information',
      icon: <Store className="w-5 h-5" />,
      path: '/onboarding/store'
    },
    {
      key: 'payment_configured' as keyof SetupStatus,
      title: 'Payment Setup',
      description: 'Stripe and payment processor configuration',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/onboarding/payment'
    },
    {
      key: 'products_added' as keyof SetupStatus,
      title: 'Products & Categories',
      description: 'Initial product catalog setup',
      icon: <Package className="w-5 h-5" />,
      path: '/onboarding/products'
    },
    {
      key: 'design_configured' as keyof SetupStatus,
      title: 'Design & Branding',
      description: 'Store appearance and branding',
      icon: <Palette className="w-5 h-5" />,
      path: '/onboarding/design'
    }
  ];

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      console.log('🚀 Completing onboarding and launching store...');
      await supabase
        .from('settings')
        .upsert([
          { key: 'onboarding_completed', value: true },
          { key: 'setup_step', value: totalSteps }
        ]);

      console.log('✅ Onboarding completed successfully!');
      toast.success('🎉 Congratulations! Your store is now ready!');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToStep = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Almost Ready to Launch!</h1>
            <p className="text-xl text-gray-600 mb-6">
              Review your setup progress and launch your store
            </p>
            
            {/* Progress Overview */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Setup Progress</span>
                <span>{completedSteps} of {totalSteps} completed</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>

          {/* Setup Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {setupSteps.map((step) => {
              const isCompleted = setupStatus[step.key];
              return (
                <Card 
                  key={step.key}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleGoToStep(step.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.icon}
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {step.description}
                    </CardDescription>
                    <div className="mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Launch Section */}
          <Card className="shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <Rocket className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Launch Your Store?</h2>
              <p className="text-blue-100 mb-6 text-lg">
                {completedSteps === totalSteps 
                  ? "All setup steps are complete! Your store is ready to go live."
                  : `You have ${totalSteps - completedSteps} step(s) remaining. You can launch now and complete them later.`
                }
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                >
                  {loading ? 'Launching...' : '🚀 Launch My Store'}
                </Button>
                
                {completedSteps < totalSteps && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/onboarding')}
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3"
                  >
                    Complete Remaining Steps
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding/design')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Design
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/onboarding')}
              className="flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Setup Overview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}