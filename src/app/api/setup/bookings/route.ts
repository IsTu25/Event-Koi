import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Bookings (
                booking_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                ticket_type_id INT,
                unique_code VARCHAR(255) UNIQUE NOT NULL,
                status ENUM('VALID', 'USED', 'CANCELLED') DEFAULT 'VALID',
                refund_amount DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
            )
        `);

        // Also ensure TicketTypes exists if not already
        await connection.query(`
            CREATE TABLE IF NOT EXISTS TicketTypes (
                ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
            )
        `);

        // Create Sponsors table too while we are at it, to be safe
        await connection.query(`
             CREATE TABLE IF NOT EXISTS Sponsors (
                sponsor_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                logo_url VARCHAR(255),
                tier ENUM('Partner', 'Bronze', 'Silver', 'Gold') DEFAULT 'Partner',
                contribution_amount DECIMAL(10, 2) DEFAULT 0.00,
                status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
                FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
            )
        `);

        connection.release();
        return NextResponse.json({ message: 'Bookings, TicketTypes, and Sponsors tables set up successfully' });
    } catch (error) {
        console.error('Error creating tables:', error);
        return NextResponse.json({ error: 'Failed to create tables' }, { status: 500 });
    }
}
