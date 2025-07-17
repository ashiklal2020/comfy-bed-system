
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedChangeRequest } from '@/types/hostel';
import { User, Bed, MessageSquare, Clock, Check, X } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<BedChangeRequest | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Mock student data with allocated bed
  const studentData = {
    full_name: user?.full_name || 'John Smith',
    course: user?.course || 'Computer Science',
    email: user?.email || 'john@student.com',
    contact_info: '+1234567890',
    allocated_bed: {
      room_number: '101',
      bed_identifier: 'A'
    }
  };

  useEffect(() => {
    // Mock check for active request
    // In a real app, this would be an API call
    const mockRequest: BedChangeRequest | null = null; // Set to null for no active request
    setActiveRequest(mockRequest);
  }, []);

  const handleRequestBedChange = async () => {
    setIsSubmittingRequest(true);
    
    // Mock API call
    setTimeout(() => {
      const newRequest: BedChangeRequest = {
        id: Date.now(),
        student: { id: user?.id || 0, name: user?.full_name || '' },
        current_bed: {
          room_number: studentData.allocated_bed.room_number,
          bed_identifier: studentData.allocated_bed.bed_identifier
        },
        status: 'pending',
        request_date: new Date().toISOString()
      };
      
      setActiveRequest(newRequest);
      setIsSubmittingRequest(false);
    }, 1000);
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
        <h1 className="text-3xl font-bold">Welcome, {studentData.full_name}!</h1>
        <p className="text-muted-foreground">Your profile and bed information</p>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <div className="text-lg">{studentData.full_name}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Course</label>
              <div className="text-lg">{studentData.course}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="text-lg">{studentData.email}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact</label>
              <div className="text-lg">{studentData.contact_info}</div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Bed className="h-5 w-5 text-primary" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Your Allocated Bed</label>
                <div className="text-lg font-medium">
                  Room {studentData.allocated_bed.room_number} - Bed {studentData.allocated_bed.bed_identifier}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Bed Change Request</span>
          </CardTitle>
          <CardDescription>
            Request a change to your current bed allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeRequest ? (
            // Show active request status
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Badge variant={getStatusVariant(activeRequest.status)} className="flex items-center space-x-1">
                  {getStatusIcon(activeRequest.status)}
                  <span className="capitalize">{activeRequest.status}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Requested: {formatDate(activeRequest.request_date)}
                </span>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Current Bed:</strong> Room {activeRequest.current_bed.room_number} - Bed {activeRequest.current_bed.bed_identifier}
                </div>
                
                {activeRequest.status === 'pending' && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Your request is being reviewed by the administration.
                  </div>
                )}
                
                {activeRequest.status === 'approved' && (
                  <div className="text-sm text-green-600 mt-2">
                    Your request has been approved! Please contact administration for your new bed assignment.
                  </div>
                )}
                
                {activeRequest.status === 'rejected' && (
                  <div className="text-sm text-destructive mt-2">
                    Your request has been rejected. You can submit a new request if needed.
                    {activeRequest.admin_notes && (
                      <div className="mt-1">
                        <strong>Note:</strong> {activeRequest.admin_notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {activeRequest.status === 'rejected' && (
                <Button onClick={handleRequestBedChange} disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? 'Submitting...' : 'Submit New Request'}
                </Button>
              )}
            </div>
          ) : (
            // Show request form
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                You currently have no active bed change requests. If you would like to request a bed change, 
                click the button below.
              </div>
              
              <Button onClick={handleRequestBedChange} disabled={isSubmittingRequest}>
                {isSubmittingRequest ? 'Submitting Request...' : 'Request Bed Change'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
