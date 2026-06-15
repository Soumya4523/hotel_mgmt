export const rooms = [
  { id: 1,  number: '101', floor: 1, type: 'Standard',     status: 'occupied',  price: 99  },
  { id: 2,  number: '102', floor: 1, type: 'Standard',     status: 'available', price: 99  },
  { id: 3,  number: '103', floor: 1, type: 'Standard',     status: 'cleaning',  price: 99  },
  { id: 4,  number: '104', floor: 1, type: 'Deluxe',       status: 'available', price: 149 },
  { id: 5,  number: '105', floor: 1, type: 'Deluxe',       status: 'available', price: 149 },
  { id: 6,  number: '201', floor: 2, type: 'Deluxe',       status: 'occupied',  price: 149 },
  { id: 7,  number: '202', floor: 2, type: 'Deluxe',       status: 'occupied',  price: 149 },
  { id: 8,  number: '203', floor: 2, type: 'Suite',        status: 'available', price: 249 },
  { id: 9,  number: '204', floor: 2, type: 'Suite',        status: 'cleaning',  price: 249 },
  { id: 10, number: '205', floor: 2, type: 'Suite',        status: 'available', price: 249 },
  { id: 11, number: '301', floor: 3, type: 'Suite',        status: 'occupied',  price: 249 },
  { id: 12, number: '302', floor: 3, type: 'Presidential', status: 'available', price: 499 },
]

export const guests = [
  { id: 1, name: 'James Wilson',   email: 'james.wilson@email.com', phone: '+1 555-0101', idNumber: 'P8823401', loyaltyPoints: 1200, totalStays: 4,  createdAt: '2024-03-15' },
  { id: 2, name: 'Sarah Chen',     email: 'sarah.chen@email.com',   phone: '+1 555-0102', idNumber: 'P7712893', loyaltyPoints: 850,  totalStays: 2,  createdAt: '2024-07-22' },
  { id: 3, name: 'Michael Brown',  email: 'm.brown@email.com',      phone: '+1 555-0103', idNumber: 'P4490021', loyaltyPoints: 2300, totalStays: 8,  createdAt: '2023-11-05' },
  { id: 4, name: 'Emma Davis',     email: 'emma.d@email.com',       phone: '+1 555-0104', idNumber: 'P6634521', loyaltyPoints: 450,  totalStays: 1,  createdAt: '2025-01-30' },
  { id: 5, name: 'Carlos Rivera',  email: 'c.rivera@email.com',     phone: '+1 555-0105', idNumber: 'P1129874', loyaltyPoints: 3100, totalStays: 12, createdAt: '2023-06-18' },
  { id: 6, name: 'Priya Patel',    email: 'priya.p@email.com',      phone: '+1 555-0106', idNumber: 'P9987651', loyaltyPoints: 720,  totalStays: 3,  createdAt: '2024-12-10' },
  { id: 7, name: 'Thomas Müller',  email: 't.muller@email.com',     phone: '+49 555-0107', idNumber: 'P3356721', loyaltyPoints: 1800, totalStays: 6,  createdAt: '2024-02-28' },
  { id: 8, name: 'Aisha Okonkwo', email: 'a.okonkwo@email.com',    phone: '+234 555-0108', idNumber: 'P7723344', loyaltyPoints: 500,  totalStays: 2,  createdAt: '2025-03-12' },
]

export const reservations = [
  { id: 1, guestId: 1, guestName: 'James Wilson',  room: '101', type: 'Standard',     checkIn: '2026-06-10', checkOut: '2026-06-13', status: 'checked_in', adults: 2, children: 0, nights: 3, total: 297 },
  { id: 2, guestId: 2, guestName: 'Sarah Chen',    room: '201', type: 'Deluxe',       checkIn: '2026-06-09', checkOut: '2026-06-11', status: 'checked_in', adults: 1, children: 0, nights: 2, total: 298 },
  { id: 3, guestId: 3, guestName: 'Michael Brown', room: '301', type: 'Suite',        checkIn: '2026-06-11', checkOut: '2026-06-15', status: 'confirmed',  adults: 2, children: 1, nights: 4, total: 996 },
  { id: 4, guestId: 4, guestName: 'Emma Davis',    room: '104', type: 'Deluxe',       checkIn: '2026-06-11', checkOut: '2026-06-12', status: 'confirmed',  adults: 2, children: 0, nights: 1, total: 149 },
  { id: 5, guestId: 5, guestName: 'Carlos Rivera', room: '202', type: 'Deluxe',       checkIn: '2026-06-08', checkOut: '2026-06-11', status: 'checked_out', adults: 1, children: 0, nights: 3, total: 447 },
  { id: 6, guestId: 6, guestName: 'Priya Patel',   room: '302', type: 'Presidential', checkIn: '2026-06-12', checkOut: '2026-06-14', status: 'confirmed',  adults: 2, children: 2, nights: 2, total: 998 },
  { id: 7, guestId: 7, guestName: 'Thomas Müller', room: '205', type: 'Suite',        checkIn: '2026-06-07', checkOut: '2026-06-10', status: 'checked_out', adults: 1, children: 0, nights: 3, total: 747 },
  { id: 8, guestId: 8, guestName: 'Aisha Okonkwo', room: '203', type: 'Suite',        checkIn: '2026-06-13', checkOut: '2026-06-16', status: 'confirmed',  adults: 2, children: 0, nights: 3, total: 747 },
]

export const staff = [
  { id: 1, name: 'Robert Kim',   email: 'r.kim@hotel.com',     phone: '+1 555-1001', role: 'admin',       shift: 'morning' },
  { id: 2, name: 'Linda Torres', email: 'l.torres@hotel.com',  phone: '+1 555-1002', role: 'manager',     shift: 'morning' },
  { id: 3, name: 'David Park',   email: 'd.park@hotel.com',    phone: '+1 555-1003', role: 'front_desk',  shift: 'morning' },
  { id: 4, name: 'Amy Johnson',  email: 'a.johnson@hotel.com', phone: '+1 555-1004', role: 'front_desk',  shift: 'evening' },
  { id: 5, name: 'Marco Silva',  email: 'm.silva@hotel.com',   phone: '+1 555-1005', role: 'housekeeping', shift: 'morning' },
  { id: 6, name: 'Nina Okafor',  email: 'n.okafor@hotel.com',  phone: '+1 555-1006', role: 'housekeeping', shift: 'evening' },
  { id: 7, name: 'Jason Lee',    email: 'j.lee@hotel.com',     phone: '+1 555-1007', role: 'front_desk',  shift: 'night'   },
]

export const housekeepingTasks = [
  { id: 1, room: '103', assignedTo: 'Marco Silva', type: 'clean',   status: 'in_progress', priority: 'urgent', notes: 'Guest checked out early — needed ASAP', createdAt: '2026-06-11 08:30' },
  { id: 2, room: '204', assignedTo: 'Marco Silva', type: 'clean',   status: 'pending',     priority: 'normal', notes: '', createdAt: '2026-06-11 09:00' },
  { id: 3, room: '202', assignedTo: 'Nina Okafor', type: 'inspect', status: 'done',        priority: 'normal', notes: 'Post checkout inspection complete', createdAt: '2026-06-11 07:00' },
  { id: 4, room: '301', assignedTo: 'Marco Silva', type: 'restock', status: 'pending',     priority: 'low',    notes: 'Mini bar and toiletries', createdAt: '2026-06-11 10:00' },
  { id: 5, room: '101', assignedTo: 'Nina Okafor', type: 'clean',   status: 'done',        priority: 'normal', notes: '', createdAt: '2026-06-10 17:00' },
  { id: 6, room: '105', assignedTo: 'Marco Silva', type: 'repair',  status: 'pending',     priority: 'urgent', notes: 'AC unit making noise', createdAt: '2026-06-11 09:30' },
]

export const invoices = [
  { id: 1, invoiceNo: 'INV-2026-001', guest: 'James Wilson',  room: '101', reservationId: 1, subtotal: 267, tax: 30,  discount: 0, total: 297,  status: 'issued', issuedAt: '2026-06-10', method: null          },
  { id: 2, invoiceNo: 'INV-2026-002', guest: 'Sarah Chen',    room: '201', reservationId: 2, subtotal: 268, tax: 30,  discount: 0, total: 298,  status: 'issued', issuedAt: '2026-06-09', method: null          },
  { id: 3, invoiceNo: 'INV-2026-003', guest: 'Carlos Rivera', room: '202', reservationId: 5, subtotal: 402, tax: 45,  discount: 0, total: 447,  status: 'paid',   issuedAt: '2026-06-11', method: 'card'        },
  { id: 4, invoiceNo: 'INV-2026-004', guest: 'Michael Brown', room: '301', reservationId: 3, subtotal: 896, tax: 100, discount: 0, total: 996,  status: 'draft',  issuedAt: '2026-06-11', method: null          },
  { id: 5, invoiceNo: 'INV-2026-005', guest: 'Thomas Müller', room: '205', reservationId: 7, subtotal: 672, tax: 75,  discount: 0, total: 747,  status: 'paid',   issuedAt: '2026-06-10', method: 'bank_transfer'},
]
