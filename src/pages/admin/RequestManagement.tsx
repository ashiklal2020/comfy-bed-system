
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedChangeRequest } from '@/types/hostel';
import { Check, X, Clock } from 'lucide-react';

const RequestManagement = () => {
  const [requests, setRequests] = useState<BedChangeRequest[]>([]);

  useEffect(() => {
    // Mock data
    const mockRequests: BedChangeRequest[] = [
      {
        id: 1,
        student: { id: 2, name: 'John Smith' },
        current_bed: { room_number: '101', bed_identifier: 'A' },
        status: 'pending',
        request_date: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        student: { id: 4, name: 'Mike Johnson' },
        current_bed: { room_number: '203', bed_identifier: 'B' },
        status: 'approved',
        request_date: '2024-01-10T14:20:00Z',
        admin_notes: 'Approved due to medical reasons'
      }
    ];

    setRequests(mockRequests);
  }, []);

  const handleUpdateRequest = (requestId: number, status: 'approved' | 'rejected', notes?: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, status, admin_notes: notes }
        : request
    ));
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
                      <span className="font-medium">{request.student.name}</span>
                      <Badge variant={getStatusVariant(request.status)} className="flex items-center space-x-1">
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Current Bed: Room {request.current_bed.room_number} - Bed {request.current_bed.bed_identifier}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Requested: {formatDate(request.request_date)}
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
