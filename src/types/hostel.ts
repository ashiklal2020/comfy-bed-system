
export interface Bed {
  id: number;
  room_number: string;
  bed_identifier: string;
  is_occupied: boolean;
  allocated_to?: {
    id: number;
    name: string;
    username: string;
  };
}

export interface Student {
  id: number;
  full_name: string;
  username: string;
  email?: string;
  contact_info?: string;
  course?: string;
  allocated_bed?: {
    id: number;
    room_number: string;
    bed_identifier: string;
  };
}

export interface BedChangeRequest {
  id: number;
  student: {
    id: number;
    name: string;
  };
  current_bed: {
    room_number: string;
    bed_identifier: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  request_date: string;
  admin_notes?: string;
}

export interface DashboardStats {
  totalBeds: number;
  allocatedBeds: number;
  vacantBeds: number;
}
