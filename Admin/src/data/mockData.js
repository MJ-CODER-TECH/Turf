// Mock data for TurfZone Admin

export const stats = {
  totalBookings: 1284,
  bookingsGrowth: 12.5,
  totalRevenue: 1548000,
  revenueGrowth: 8.3,
  activeUsers: 3892,
  usersGrowth: 21.4,
  totalTurfs: 24,
  turfsGrowth: 4.2,
};

export const revenueData = [
  { month: 'Oct', revenue: 98000, bookings: 82 },
  { month: 'Nov', revenue: 112000, bookings: 95 },
  { month: 'Dec', revenue: 134000, bookings: 118 },
  { month: 'Jan', revenue: 145000, bookings: 127 },
  { month: 'Feb', revenue: 128000, bookings: 109 },
  { month: 'Mar', revenue: 167000, bookings: 142 },
];

export const bookingsByDay = [
  { day: 'Mon', count: 38 },
  { day: 'Tue', count: 42 },
  { day: 'Wed', count: 35 },
  { day: 'Thu', count: 55 },
  { day: 'Fri', count: 78 },
  { day: 'Sat', count: 112 },
  { day: 'Sun', count: 98 },
];

export const sportDistribution = [
  { name: 'Football', value: 48, color: '#22c55e' },
  { name: 'Cricket', value: 28, color: '#3b82f6' },
  { name: 'Basketball', value: 12, color: '#f59e0b' },
  { name: 'Badminton', value: 8, color: '#8b5cf6' },
  { name: 'Tennis', value: 4, color: '#ec4899' },
];

export const bookings = [
  { id: 'BK001', user: 'Rahul Sharma', turf: 'Champions Football Turf', sport: 'Football', date: '2024-03-18', time: '06:00 - 07:00', amount: 1200, status: 'confirmed' },
  { id: 'BK002', user: 'Priya Patel', turf: 'Cirket Turf Best', sport: 'Cricket', date: '2024-03-18', time: '08:00 - 10:00', amount: 2400, status: 'confirmed' },
  { id: 'BK003', user: 'Amit Singh', turf: 'Green Arena Turf', sport: 'Football', date: '2024-03-18', time: '17:00 - 18:00', amount: 1500, status: 'pending' },
  { id: 'BK004', user: 'Sneha Kulkarni', turf: 'Champions Football Turf', sport: 'Football', date: '2024-03-17', time: '19:00 - 21:00', amount: 2400, status: 'completed' },
  { id: 'BK005', user: 'Vikram Joshi', turf: 'Sky High Courts', sport: 'Basketball', date: '2024-03-17', time: '07:00 - 08:00', amount: 900, status: 'cancelled' },
  { id: 'BK006', user: 'Deepak Verma', turf: 'Ace Badminton Arena', sport: 'Badminton', date: '2024-03-17', time: '10:00 - 11:00', amount: 600, status: 'completed' },
  { id: 'BK007', user: 'Anita Rao', turf: 'Cirket Turf Best', sport: 'Cricket', date: '2024-03-16', time: '14:00 - 16:00', amount: 2400, status: 'confirmed' },
  { id: 'BK008', user: 'Rohan Desai', turf: 'Champions Football Turf', sport: 'Football', date: '2024-03-16', time: '18:00 - 20:00', amount: 2400, status: 'completed' },
];

export const turfs = [
  { id: 'T001', name: 'Champions Football Turf', location: 'Pune, Baner', sport: 'Football', price: 1200, rating: 4.0, reviews: 48, status: 'active', bookings: 312, revenue: 374400, image: '⚽' },
  { id: 'T002', name: 'Cirket Turf Best Second', location: 'Pune, Baner', sport: 'Cricket', price: 1200, rating: 4.2, reviews: 36, status: 'active', bookings: 198, revenue: 237600, image: '🏏' },
  { id: 'T003', name: 'Champions Football Turf Updated', location: 'Pune, Baner', sport: 'Football', price: 1400, rating: 3.8, reviews: 22, status: 'active', bookings: 145, revenue: 203000, image: '⚽' },
  { id: 'T004', name: 'Sky High Basketball Courts', location: 'Pune, Kothrud', sport: 'Basketball', price: 900, rating: 4.5, reviews: 61, status: 'active', bookings: 224, revenue: 201600, image: '🏀' },
  { id: 'T005', name: 'Ace Badminton Arena', location: 'Mumbai, Andheri', sport: 'Badminton', price: 600, rating: 4.3, reviews: 89, status: 'active', bookings: 405, revenue: 243000, image: '🏸' },
  { id: 'T006', name: 'Green Arena Multi-Sport', location: 'Mumbai, Powai', sport: 'Football', price: 1500, rating: 3.5, reviews: 14, status: 'maintenance', bookings: 0, revenue: 0, image: '🏟️' },
];

export const users = [
  { id: 'U001', name: 'Rahul Sharma', email: 'rahul@email.com', phone: '+91 98765 43210', city: 'Pune', bookings: 24, totalSpent: 28800, joinDate: '2023-06-15', status: 'active' },
  { id: 'U002', name: 'Priya Patel', email: 'priya@email.com', phone: '+91 98765 43211', city: 'Mumbai', bookings: 18, totalSpent: 21600, joinDate: '2023-07-20', status: 'active' },
  { id: 'U003', name: 'Amit Singh', email: 'amit@email.com', phone: '+91 98765 43212', city: 'Pune', bookings: 31, totalSpent: 37200, joinDate: '2023-04-10', status: 'active' },
  { id: 'U004', name: 'Sneha Kulkarni', email: 'sneha@email.com', phone: '+91 98765 43213', city: 'Pune', bookings: 12, totalSpent: 14400, joinDate: '2023-09-05', status: 'active' },
  { id: 'U005', name: 'Vikram Joshi', email: 'vikram@email.com', phone: '+91 98765 43214', city: 'Mumbai', bookings: 7, totalSpent: 6300, joinDate: '2023-11-12', status: 'inactive' },
  { id: 'U006', name: 'Deepak Verma', email: 'deepak@email.com', phone: '+91 98765 43215', city: 'Nashik', bookings: 42, totalSpent: 50400, joinDate: '2023-03-01', status: 'active' },
  { id: 'U007', name: 'Anita Rao', email: 'anita@email.com', phone: '+91 98765 43216', city: 'Pune', bookings: 9, totalSpent: 10800, joinDate: '2023-12-18', status: 'active' },
];

export const payments = [
  { id: 'PAY001', bookingId: 'BK001', user: 'Rahul Sharma', amount: 1200, method: 'UPI', date: '2024-03-18', status: 'success' },
  { id: 'PAY002', bookingId: 'BK002', user: 'Priya Patel', amount: 2400, method: 'Card', date: '2024-03-18', status: 'success' },
  { id: 'PAY003', bookingId: 'BK003', user: 'Amit Singh', amount: 1500, method: 'UPI', date: '2024-03-18', status: 'pending' },
  { id: 'PAY004', bookingId: 'BK004', user: 'Sneha Kulkarni', amount: 2400, method: 'Net Banking', date: '2024-03-17', status: 'success' },
  { id: 'PAY005', bookingId: 'BK005', user: 'Vikram Joshi', amount: 900, method: 'UPI', date: '2024-03-17', status: 'refunded' },
  { id: 'PAY006', bookingId: 'BK006', user: 'Deepak Verma', amount: 600, method: 'Wallet', date: '2024-03-17', status: 'success' },
  { id: 'PAY007', bookingId: 'BK007', user: 'Anita Rao', amount: 2400, method: 'Card', date: '2024-03-16', status: 'success' },
  { id: 'PAY008', bookingId: 'BK008', user: 'Rohan Desai', amount: 2400, method: 'UPI', date: '2024-03-16', status: 'success' },
];

export const timeSlots = [
  { turf: 'Champions Football Turf', slots: [
    { time: '05:00 - 06:00', status: 'available', price: 1200 },
    { time: '06:00 - 07:00', status: 'booked', price: 1200 },
    { time: '07:00 - 08:00', status: 'booked', price: 1200 },
    { time: '08:00 - 09:00', status: 'available', price: 1200 },
    { time: '09:00 - 10:00', status: 'available', price: 1200 },
    { time: '10:00 - 11:00', status: 'blocked', price: 1200 },
    { time: '16:00 - 17:00', status: 'available', price: 1500 },
    { time: '17:00 - 18:00', status: 'booked', price: 1500 },
    { time: '18:00 - 19:00', status: 'booked', price: 1500 },
    { time: '19:00 - 20:00', status: 'booked', price: 1500 },
    { time: '20:00 - 21:00', status: 'available', price: 1500 },
    { time: '21:00 - 22:00', status: 'available', price: 1500 },
  ]},
];
