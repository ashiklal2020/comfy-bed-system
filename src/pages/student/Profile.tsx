
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Bed, MessageSquare, Clock, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentProfile {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  contact_info?: string;
  course?: string;
  allocated_bed?: {
    id: string;
    room_number: string;
    bed_identifier: string;
  } | null;
}

interface BedChangeRequest {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
  current_bed: {
    room_number: string;
    bed_identifier: string;
  } | null;
}

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeRequest, setActiveRequest] = useState<BedChangeRequest | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          allocated_bed:beds!allocated_to (
            id,
            room_number,
            bed_identifier
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchActiveRequest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bed_change_requests')
        .select(`
          *,
          current_bed:beds!current_bed_id (
            room_number,
            bed_identifier
          )
        `)
        .eq('student_id', user.id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveRequest(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActiveRequest();
    }
  }, [user]);

  const handleRequestBedChange = async () => {
    if (!user || !profile) return;

    setIsSubmittingRequest(true);
    
    try {
      const { error } = await supabase
        .from('bed_change_requests')
        .insert({
          student_id: user.id,
          current_bed_id: profile.allocated_bed?.id || null,
          reason: requestReason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your bed change request has been submitted for review",
      });

      setRequestReason('');
      setIsDialogOpen(false);
      fetchActiveRequest();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRequest(false);
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
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading profile: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Profile not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {profile.full_name}!</h1>
        <p className="text-muted-foreground">Your profile and bed information</p>
      </div>

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
              <div className="text-lg">{profile.full_name}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <div className="text-lg">{profile.username}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="text-lg">{profile.email || 'Not provided'}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact</label>
              <div className="text-lg">{profile.contact_info || 'Not provided'}</div>
            </div>

            {profile.course && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course</label>
                <div className="text-lg">{profile.course}</div>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Bed className="h-5 w-5 text-primary" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Your Allocated Bed</label>
                <div className="text-lg font-medium">
                  {profile.allocated_bed ? 
                    `Room ${profile.allocated_bed.room_number} - Bed ${profile.allocated_bed.bed_identifier}` : 
                    'No bed assigned'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Badge variant={getStatusVariant(activeRequest.status)} className="flex items-center space-x-1">
                  {getStatusIcon(activeRequest.status)}
                  <span className="capitalize">{activeRequest.status}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Requested: {formatDate(activeRequest.created_at)}
                </span>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Current Bed:</strong> {activeRequest.current_bed ? 
                    `Room ${activeRequest.current_bed.room_number} - Bed ${activeRequest.current_bed.bed_identifier}` : 
                    'No bed assigned'
                  }
                </div>
                
                {activeRequest.reason && (
                  <div className="text-sm mt-2">
                    <strong>Reason:</strong> {activeRequest.reason}
                  </div>
                )}
                
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
                
                {activeRequest.admin_notes && (
                  <div className="text-sm mt-2">
                    <strong>Admin Notes:</strong> {activeRequest.admin_notes}
                  </div>
                )}
              </div>
              
              {activeRequest.status === 'rejected' && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Submit New Request</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Bed Change Request</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for your bed change request
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Reason for bed change</Label>
                        <Textarea
                          id="reason"
                          value={requestReason}
                          onChange={(e) => setRequestReason(e.target.value)}
                          placeholder="Please explain why you need a bed change..."
                          required
                        />
                      </div>
                      <Button 
                        onClick={handleRequestBedChange} 
                        disabled={isSubmittingRequest || !requestReason.trim()}
                        className="w-full"
                      >
                        {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                You currently have no active bed change requests. If you would like to request a bed change, 
                click the button below.
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Request Bed Change</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Bed Change Request</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for your bed change request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Reason for bed change</Label>
                      <Textarea
                        id="reason"
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        placeholder="Please explain why you need a bed change..."
                        required
                      />
                    </div>
                    <Button 
                      onClick={handleRequestBedChange} 
                      disabled={isSubmittingRequest || !requestReason.trim()}
                      className="w-full"
                    >
                      {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
