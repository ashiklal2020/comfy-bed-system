
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bed, Student } from '@/types/hostel';
import { Plus, Edit, Trash2 } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [vacantBeds, setVacantBeds] = useState<Bed[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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

  useEffect(() => {
    // Mock data
    const mockStudents: Student[] = [
      {
        id: 2,
        full_name: 'John Smith',
        username: 'student',
        email: 'john@student.com',
        contact_info: '+1234567890',
        course: 'Computer Science',
        allocated_bed: { id: 1, room_number: '101', bed_identifier: 'A' }
      },
      {
        id: 3,
        full_name: 'Jane Doe',
        username: 'jdoe',
        email: 'jane@student.com',
        contact_info: '+1234567891',
        course: 'Mathematics',
        allocated_bed: { id: 3, room_number: '102', bed_identifier: 'A' }
      }
    ];

    const mockVacantBeds: Bed[] = [
      { id: 2, room_number: '101', bed_identifier: 'B', is_occupied: false },
      { id: 4, room_number: '102', bed_identifier: 'B', is_occupied: false },
      { id: 5, room_number: '103', bed_identifier: 'A', is_occupied: false }
    ];

    setStudents(mockStudents);
    setVacantBeds(mockVacantBeds);
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

  const handleAddStudent = () => {
    const selectedBed = vacantBeds.find(bed => bed.id.toString() === formData.bed_id);
    if (!selectedBed) return;

    const newStudent: Student = {
      id: Date.now(),
      full_name: formData.full_name,
      username: formData.username,
      email: formData.email,
      contact_info: formData.contact_info,
      course: formData.course,
      allocated_bed: {
        id: selectedBed.id,
        room_number: selectedBed.room_number,
        bed_identifier: selectedBed.bed_identifier
      }
    };

    setStudents(prev => [...prev, newStudent]);
    setVacantBeds(prev => prev.filter(bed => bed.id.toString() !== formData.bed_id));
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleDeleteStudent = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (student?.allocated_bed) {
      const releasedBed: Bed = {
        id: student.allocated_bed.id,
        room_number: student.allocated_bed.room_number,
        bed_identifier: student.allocated_bed.bed_identifier,
        is_occupied: false
      };
      setVacantBeds(prev => [...prev, releasedBed]);
    }
    
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleEditBed = (student: Student, newBedId: string) => {
    const newBed = vacantBeds.find(bed => bed.id.toString() === newBedId);
    if (!newBed) return;

    // Release old bed
    if (student.allocated_bed) {
      const oldBed: Bed = {
        id: student.allocated_bed.id,
        room_number: student.allocated_bed.room_number,
        bed_identifier: student.allocated_bed.bed_identifier,
        is_occupied: false
      };
      setVacantBeds(prev => [...prev, oldBed]);
    }

    // Update student with new bed
    setStudents(prev => prev.map(s => 
      s.id === student.id 
        ? {
            ...s,
            allocated_bed: {
              id: newBed.id,
              room_number: newBed.room_number,
              bed_identifier: newBed.bed_identifier
            }
          }
        : s
    ));

    // Remove new bed from vacant list
    setVacantBeds(prev => prev.filter(bed => bed.id.toString() !== newBedId));
  };

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
                Enter student details and allocate a bed
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
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
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
                <Label htmlFor="bed_id">Allocate Bed</Label>
                <Select value={formData.bed_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bed_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vacant bed" />
                  </SelectTrigger>
                  <SelectContent>
                    {vacantBeds.map((bed) => (
                      <SelectItem key={bed.id} value={bed.id.toString()}>
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

      {/* Students Table */}
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
                    Username: {student.username} | Course: {student.course}
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
                                <SelectItem key={bed.id} value={bed.id.toString()}>
                                  Room {bed.room_number} - Bed {bed.bed_identifier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteStudent(student.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
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
