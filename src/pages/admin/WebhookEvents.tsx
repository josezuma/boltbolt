import { useState, useEffect } from 'react';
import { 
  Webhook, 
  RefreshCw, 
  MoreHorizontal, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type WebhookEvent = Database['public']['Tables']['webhook_events']['Row'] & {
  payment_processors: { name: string; display_name: string } | null;
};

export function WebhookEvents() {
  const { user, isAdmin } = useAuthStore();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchWebhookEvents();
    }
  }, [user, isAdmin]);

  const fetchWebhookEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select(`
          *,
          payment_processors (name, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      toast.error('Failed to load webhook events');
    } finally {
      setLoading(false);
    }
  };

  const markAsProcessed = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('webhook_events')
        .update({ 
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              processed: true,
              processed_at: new Date().toISOString()
            } 
          : event
      ));
      
      toast.success('Event marked as processed');
    } catch (error) {
      console.error('Error updating webhook event:', error);
      toast.error('Failed to update webhook event');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this webhook event?')) return;

    try {
      const { error } = await supabase
        .from('webhook_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      toast.success('Webhook event deleted successfully');
    } catch (error) {
      console.error('Error deleting webhook event:', error);
      toast.error('Failed to delete webhook event');
    }
  };

  const viewEventDetails = (event: WebhookEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getEventStatusBadge = (event: WebhookEvent) => {
    if (event.processed) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Processed
        </Badge>
      );
    } else if (event.processing_attempts > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <RefreshCw className="w-3 h-3 mr-1" />
          Retrying
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Webhook Events</h1>
            <p className="text-muted-foreground">Monitor and manage payment webhook events</p>
          </div>
          <Button onClick={fetchWebhookEvents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Webhook Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Webhook className="w-5 h-5 mr-2" />
              Recent Webhook Events
            </CardTitle>
            <CardDescription>
              Payment processor webhook events received by your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Event ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Webhook className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No webhook events received yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Webhook events will appear here when payment processors send notifications
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="font-medium">{formatEventType(event.event_type)}</div>
                        </TableCell>
                        <TableCell>
                          {event.payment_processors?.display_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {event.event_id.substring(0, 12)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          {getEventStatusBadge(event)}
                        </TableCell>
                        <TableCell>
                          {new Date(event.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewEventDetails(event)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!event.processed && (
                                <DropdownMenuItem onClick={() => markAsProcessed(event.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Processed
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => deleteEvent(event.id)}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        {selectedEvent && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Webhook Event Details</DialogTitle>
                <DialogDescription>
                  Event ID: {selectedEvent.event_id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Event Type</h3>
                    <p className="font-medium">{formatEventType(selectedEvent.event_type)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Processor</h3>
                    <p className="font-medium">{selectedEvent.payment_processors?.display_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>{getEventStatusBadge(selectedEvent)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Received At</h3>
                    <p className="font-medium">{new Date(selectedEvent.created_at).toLocaleString()}</p>
                  </div>
                  {selectedEvent.processed && selectedEvent.processed_at && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Processed At</h3>
                      <p className="font-medium">{new Date(selectedEvent.processed_at).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedEvent.processing_attempts > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Processing Attempts</h3>
                      <p className="font-medium">{selectedEvent.processing_attempts}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Event Data</h3>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs">
                      {JSON.stringify(selectedEvent.event_data, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {selectedEvent.last_processing_error && (
                  <div>
                    <h3 className="text-sm font-medium text-red-500 mb-2">Processing Error</h3>
                    <div className="bg-red-50 text-red-800 p-4 rounded-md">
                      <p className="text-sm">{selectedEvent.last_processing_error}</p>
                    </div>
                  </div>
                )}
                
                {selectedEvent.payment_transaction_id && (
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/admin/transactions/${selectedEvent.payment_transaction_id}`}>
                        View Related Transaction
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}