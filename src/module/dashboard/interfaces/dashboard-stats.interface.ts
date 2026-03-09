export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalEmployees: number;
  totalRestaurants: number;
  activeRestaurants: number;
  customersByRole: {
    admin: number;
    manager: number;
    waiter: number;
    user: number;
  };
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;
}
