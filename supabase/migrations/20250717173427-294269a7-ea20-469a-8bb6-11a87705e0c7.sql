
-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Create enum for request status
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  contact_info TEXT,
  course TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create beds table
CREATE TABLE public.beds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  bed_identifier TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE,
  allocated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(room_number, bed_identifier)
);

-- Create bed change requests table
CREATE TABLE public.bed_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  requested_bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  reason TEXT,
  status request_status DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert some sample beds
INSERT INTO public.beds (room_number, bed_identifier) VALUES
('101', 'A'), ('101', 'B'),
('102', 'A'), ('102', 'B'),
('103', 'A'), ('103', 'B'),
('104', 'A'), ('104', 'B'),
('105', 'A'), ('105', 'B');

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_change_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for beds
CREATE POLICY "Everyone can view beds" ON public.beds
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage beds" ON public.beds
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for bed change requests
CREATE POLICY "Students can view their own requests" ON public.bed_change_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all requests" ON public.bed_change_requests
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can create their own requests" ON public.bed_change_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update all requests" ON public.bed_change_requests
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update bed allocation
CREATE OR REPLACE FUNCTION public.allocate_bed(bed_id UUID, student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if bed is available
  IF EXISTS (SELECT 1 FROM public.beds WHERE id = bed_id AND is_occupied = TRUE) THEN
    RETURN FALSE;
  END IF;
  
  -- Deallocate any previous bed for this student
  UPDATE public.beds 
  SET is_occupied = FALSE, allocated_to = NULL, updated_at = NOW()
  WHERE allocated_to = student_id;
  
  -- Allocate new bed
  UPDATE public.beds 
  SET is_occupied = TRUE, allocated_to = student_id, updated_at = NOW()
  WHERE id = bed_id;
  
  RETURN TRUE;
END;
$$;

-- Function to deallocate bed
CREATE OR REPLACE FUNCTION public.deallocate_bed(bed_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.beds 
  SET is_occupied = FALSE, allocated_to = NULL, updated_at = NOW()
  WHERE id = bed_id;
  
  RETURN TRUE;
END;
$$;
