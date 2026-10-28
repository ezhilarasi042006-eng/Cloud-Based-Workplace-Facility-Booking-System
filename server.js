const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const facilities = [
  { id: 'MR-101', name: 'Meeting Room A', type: 'Meeting Room', capacity: 8, location: 'Floor 1', features: 'Display screen, Whiteboard' },
  { id: 'CR-201', name: 'Conference Hall', type: 'Conference Hall', capacity: 30, location: 'Floor 2', features: 'Projector, Video conferencing' },
  { id: 'WS-301', name: 'Focus Workspace', type: 'Workspace', capacity: 4, location: 'Floor 3', features: 'Quiet zone, Power outlets' },
  { id: 'MR-102', name: 'Meeting Room B', type: 'Meeting Room', capacity: 12, location: 'Floor 1', features: 'Smart display, Whiteboard' }
];

function readBookings() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error('Could not read bookings:', error.message);
    return [];
  }
}
function saveBookings(bookings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
}
function validDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

app.get('/api/facilities', (req, res) => res.json(facilities));
app.get('/api/bookings', (req, res) => res.json(readBookings().sort((a, b) => a.start.localeCompare(b.start))));

app.post('/api/bookings', (req, res) => {
  const { employeeName, employeeEmail, facilityId, date, startTime, endTime, purpose } = req.body;
  if (![employeeName, employeeEmail, facilityId, date, startTime, endTime, purpose].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'Please complete all fields.' });
  }
  const facility = facilities.find(item => item.id === facilityId);
  if (!facility) return res.status(400).json({ error: 'Please select a valid facility.' });
  const start = `${date}T${startTime}`;
  const end = `${date}T${endTime}`;
  if (!validDateTime(start) || !validDateTime(end) || Date.parse(end) <= Date.parse(start)) {
    return res.status(400).json({ error: 'End time must be later than start time.' });
  }
  const bookings = readBookings();
  const conflict = bookings.some(b => b.facilityId === facilityId && b.status === 'Confirmed' && Date.parse(start) < Date.parse(b.end) && Date.parse(end) > Date.parse(b.start));
  if (conflict) return res.status(409).json({ error: 'This facility is already booked during that time. Please choose another time.' });
  const booking = {
    id: `WFB-${Date.now().toString().slice(-8)}`,
    employeeName: employeeName.trim(), employeeEmail: employeeEmail.trim(), facilityId,
    facilityName: facility.name, date, start, end, purpose: purpose.trim(), status: 'Confirmed',
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  saveBookings(bookings);
  res.status(201).json(booking);
});

app.patch('/api/bookings/:id/cancel', (req, res) => {
  const bookings = readBookings();
  const booking = bookings.find(item => item.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status === 'Cancelled') return res.status(400).json({ error: 'This booking is already cancelled.' });
  booking.status = 'Cancelled';
  saveBookings(bookings);
  res.json(booking);
});

app.listen(PORT, () => console.log(`Workplace Facility Booking System running at http://localhost:${PORT}`));
