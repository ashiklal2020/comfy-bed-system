
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SupabaseLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setUserRole(data?.role || null);
          setUserProfile(data);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin/students', label: 'Students', icon: Users },
    { path: '/admin/requests', label: 'Requests', icon: MessageSquare }
  ];

  const studentNavItems = [
    { path: '/student/profile', label: 'My Profile', icon: User }
  ];

  const navItems = userRole === 'admin' ? adminNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">Hostel Management</h1>
            
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive(item.path) 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {userProfile?.full_name} ({userRole})
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default SupabaseLayout;
