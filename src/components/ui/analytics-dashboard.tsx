import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Download, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface SalesDataPoint {
  date: string;
  amount: number;
  orders: number;
}

interface CustomerDataPoint {
  date: string;
  newCustomers: number;
  activeCustomers: number;
}

interface ProductDataPoint {
  name: string;
  value: number;
}

interface AnalyticsDashboardProps {
  salesData: SalesDataPoint[];
  productData: ProductDataPoint[];
  customerData: CustomerDataPoint[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function AnalyticsDashboard({ 
  salesData, 
  productData, 
  customerData,
  timeRange,
  onTimeRangeChange
}: AnalyticsDashboardProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  
  const handleTimeRangeChange = (range: string) => {
    onTimeRangeChange(range);
  };
  
  return (
    <div className="space-y-8">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant={chartType === 'bar' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Bar
          </Button>
          <Button 
            variant={chartType === 'line' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('line')}
          >
            <LineChartIcon className="w-4 h-4 mr-2" />
            Line
          </Button>
          <Button 
            variant={chartType === 'area' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('area')}
          >
            <LineChartIcon className="w-4 h-4 mr-2" />
            Area
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={timeRange === '7d' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleTimeRangeChange('7d')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === '30d' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleTimeRangeChange('30d')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === '90d' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleTimeRangeChange('90d')}
          >
            90 Days
          </Button>
          <Button 
            variant={timeRange === '1y' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleTimeRangeChange('1y')}
          >
            1 Year
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                Revenue and order trends over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="amount" name="Revenue ($)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#82ca9d" />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="amount" name="Revenue ($)" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#82ca9d" />
                  </LineChart>
                ) : (
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="amount" name="Revenue ($)" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="orders" name="Orders" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth</CardTitle>
              <CardDescription>
                New and active customers over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newCustomers" name="New Customers" fill="#8884d8" />
                    <Bar dataKey="activeCustomers" name="Active Customers" fill="#82ca9d" />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newCustomers" name="New Customers" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="activeCustomers" name="Active Customers" stroke="#82ca9d" />
                  </LineChart>
                ) : (
                  <AreaChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="newCustomers" name="New Customers" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="activeCustomers" name="Active Customers" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Best-selling products by units sold
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} units`, 'Sales']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}