
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BedChangeRequest {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
  profiles: {
    id: string;
    full_name: string;
  };
  current_bed: {
    room_number: string;
    bed_identifier: string;
  } | null;
}

const RequestManagement = () => {
  const [requests, setRequests] = useState<BedChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('bed_change_requests')
        .select(`
          *,
          profiles!student_id (
            id,
            full_name
          ),
          current_bed:beds!current_bed_id (
            room_number,
            bed_identifier
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateRequest = async (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('bed_change_requests')
        .update({ 
          status, 
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Updated",
        description: `Request has been ${status}`,
      });

      fetchRequests();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading requests: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bed Change Requests</h1>
        <p className="text-muted-foreground">Review and manage student bed change requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Student requests for bed changes. Approving a request updates its status only - 
            you must manually reassign the bed in Student Management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bed change requests found
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{request.profiles.full_name}</span>
                      <Badge variant={getStatusVariant(request.status)} className="flex items-center space-x-1">
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Current Bed: {request.current_bed ? 
                        `Room ${request.current_bed.room_number} - Bed ${request.current_bed.bed_identifier}` : 
                        'No bed assigned'
                      }
                    </div>
                    
                    {request.reason && (
                      <div className="text-sm">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      Requested: {formatDate(request.created_at)}
                    </div>
                    
                    {request.admin_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Admin Notes:</span> {request.admin_notes}
                      </div>
                    )}
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUpdateRequest(request.id, 'approved', 'Request approved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUpdateRequest(request.id, 'rejected', 'Request rejected')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestManagement;
