
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, DashboardStats } from '@/types/hostel';

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBeds: 0,
    allocatedBeds: 0,
    vacantBeds: 0
  });
  const [beds, setBeds] = useState<Bed[]>([]);

  useEffect(() => {
    // Mock data - in a real app, this would be API calls
    const mockBeds: Bed[] = [
      {
        id: 1,
        room_number: '101',
        bed_identifier: 'A',
        is_occupied: true,
        allocated_to: { id: 2, name: 'John Smith', username: 'student' }
      },
      {
        id: 2,
        room_number: '101',
        bed_identifier: 'B',
        is_occupied: false
      },
      {
        id: 3,
        room_number: '102',
        bed_identifier: 'A',
        is_occupied: true,
        allocated_to: { id: 3, name: 'Jane Doe', username: 'jdoe' }
      },
      {
        id: 4,
        room_number: '102',
        bed_identifier: 'B',
        is_occupied: false
      },
      {
        id: 5,
        room_number: '103',
        bed_identifier: 'A',
        is_occupied: false
      }
    ];

    setBeds(mockBeds);
    
    const allocated = mockBeds.filter(bed => bed.is_occupied).length;
    const total = mockBeds.length;
    
    setStats({
      totalBeds: total,
      allocatedBeds: allocated,
      vacantBeds: total - allocated
    });
  }, []);

  const handleDeallocate = (bedId: number) => {
    setBeds(prevBeds => 
      prevBeds.map(bed => 
        bed.id === bedId 
          ? { ...bed, is_occupied: false, allocated_to: undefined }
          : bed
      )
    );
    
    setStats(prevStats => ({
      ...prevStats,
      allocatedBeds: prevStats.allocatedBeds - 1,
      vacantBeds: prevStats.vacantBeds + 1
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hostel Overview</h1>
        <p className="text-muted-foreground">Dashboard overview of bed allocations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBeds}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.allocatedBeds}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vacant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.vacantBeds}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bed List */}
      <Card>
        <CardHeader>
          <CardTitle>Bed Status</CardTitle>
          <CardDescription>Current status of all beds in the hostel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {beds.map((bed) => (
              <div key={bed.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">
                    Room {bed.room_number} - Bed {bed.bed_identifier}
                  </span>
                  {bed.is_occupied ? (
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Occupied</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({bed.allocated_to?.name})
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">Vacant</Badge>
                  )}
                </div>
                
                {bed.is_occupied && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeallocate(bed.id)}
                  >
                    Deallocate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
