
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
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
  };
}

interface Bed {
  id: string;
  room_number: string;
  bed_identifier: string;
  is_occupied: boolean;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [vacantBeds, setVacantBeds] = useState<Bed[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    email: '',
    contact_info: '',
    course: '',
    bed_id: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch students with their allocated beds
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select(`
          *,
          allocated_bed:beds!allocated_to (
            id,
            room_number,
            bed_identifier
          )
        `)
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Fetch vacant beds
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select('*')
        .eq('is_occupied', false);

      if (bedsError) throw bedsError;

      setStudents(studentsData || []);
      setVacantBeds(bedsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      full_name: '',
      username: '',
      password: '',
      email: '',
      contact_info: '',
      course: '',
      bed_id: ''
    });
  };

  const handleAddStudent = async () => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            username: formData.username,
            role: 'student'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            contact_info: formData.contact_info,
            course: formData.course
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Allocate bed if selected
        if (formData.bed_id) {
          const { error: bedError } = await supabase
            .rpc('allocate_bed', {
              bed_id: formData.bed_id,
              student_id: authData.user.id
            });

          if (bedError) throw bedError;
        }

        toast({
          title: "Student Added",
          description: "Student has been successfully registered",
        });

        resetForm();
        setIsAddDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // First deallocate any bed
      const student = students.find(s => s.id === studentId);
      if (student?.allocated_bed) {
        await supabase.rpc('deallocate_bed', {
          bed_id: student.allocated_bed.id
        });
      }

      // Delete from auth (this will cascade to profiles)
      const { error } = await supabase.auth.admin.deleteUser(studentId);
      if (error) throw error;

      toast({
        title: "Student Deleted",
        description: "Student has been removed from the system",
      });

      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEditBed = async (student: Student, newBedId: string) => {
    try {
      const { error } = await supabase.rpc('allocate_bed', {
        bed_id: newBedId,
        student_id: student.id
      });

      if (error) throw error;

      toast({
        title: "Bed Updated",
        description: "Student's bed allocation has been updated",
      });

      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeallocateBed = async (student: Student) => {
    if (!student.allocated_bed) return;

    try {
      const { error } = await supabase.rpc('deallocate_bed', {
        bed_id: student.allocated_bed.id
      });

      if (error) throw error;

      toast({
        title: "Bed Deallocated",
        description: "Bed has been deallocated from the student",
      });

      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading data: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">Manage student records and bed allocations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter student details and optionally allocate a bed
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_info">Contact Info</Label>
                  <Input
                    id="contact_info"
                    value={formData.contact_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="bed_id">Allocate Bed (Optional)</Label>
                <Select value={formData.bed_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bed_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vacant bed (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {vacantBeds.map((bed) => (
                      <SelectItem key={bed.id} value={bed.id}>
                        Room {bed.room_number} - Bed {bed.bed_identifier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAddStudent} className="w-full">
                Save Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>List of all registered students and their bed assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Username: {student.username} {student.course && `| Course: ${student.course}`}
                  </div>
                  <div className="text-sm">
                    Allocated Bed: {student.allocated_bed ? 
                      `Room ${student.allocated_bed.room_number} - Bed ${student.allocated_bed.bed_identifier}` : 
                      'No bed assigned'
                    }
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Bed
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Bed Assignment</DialogTitle>
                        <DialogDescription>
                          Change bed assignment for {student.full_name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Current Bed</Label>
                          <div className="p-2 bg-muted rounded">
                            {student.allocated_bed ? 
                              `Room ${student.allocated_bed.room_number} - Bed ${student.allocated_bed.bed_identifier}` : 
                              'No bed assigned'
                            }
                          </div>
                        </div>
                        
                        <div>
                          <Label>New Bed</Label>
                          <Select onValueChange={(value) => handleEditBed(student, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a new bed" />
                            </SelectTrigger>
                            <SelectContent>
                              {vacantBeds.map((bed) => (
                                <SelectItem key={bed.id} value={bed.id}>
                                  Room {bed.room_number} - Bed {bed.bed_identifier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {student.allocated_bed && (
                          <div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Deallocate Current Bed
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deallocate Bed</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the bed allocation for {student.full_name}. 
                                    The student will remain in the system but without a bed assignment.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeallocateBed(student)}>
                                    Deallocate Bed
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {student.full_name}? This will permanently 
                          remove the student from the system and deallocate any assigned bed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Student
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagement;
