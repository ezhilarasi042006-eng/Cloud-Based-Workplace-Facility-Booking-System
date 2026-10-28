# Cloud-Based Workplace Facility Booking System

A simple workplace facility booking web application. Employees can browse facilities, reserve a space for a date and time, view reservations, and cancel a booking.

## Features
- Facility cards for meeting rooms, a conference hall, and a focused workspace
- Employee name and email capture
- Date and time selection with validation
- Prevents overlapping confirmed bookings for the same facility
- Booking reference number and reservation list
- Cancel reservation and refresh list
- JSON file storage; no local database installation required

## Technology
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Storage: `data/bookings.json`

## Run on Windows
1. Install Node.js if it is not already installed.
2. Extract the ZIP file.
3. Open Command Prompt in the project folder (the folder containing `package.json`).
4. Install dependencies:
   ```cmd
   npm install
   ```
5. Start the server:
   ```cmd
   npm start
   ```
6. Open `http://localhost:3000` in your browser. Keep the Command Prompt window open while using the website.

## Notes
This is a starter/demo project. The JSON file is suitable for local testing, not multi-instance production cloud hosting. For a real cloud deployment, replace JSON storage with a managed database and deploy the app to a hosting provider.
