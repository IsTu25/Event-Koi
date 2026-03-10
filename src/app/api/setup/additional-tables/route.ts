import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const results: { table: string; status: string; error?: string }[] = [];

    try {
        // Read and execute the additional tables SQL
        const sqlPath = path.join(process.cwd(), 'database', '15_additional_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Split on semicolons, skip comments and empty
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 5 && !s.startsWith('--'));

        for (const stmt of statements) {
            // Extract table name for labelling
            const match = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)
                || stmt.match(/INSERT IGNORE INTO (\w+)/i);
            const label = match ? match[1] : stmt.substring(0, 40);
            try {
                await pool.query(stmt + ';');
                results.push({ table: label, status: 'OK' });
            } catch (err: any) {
                results.push({ table: label, status: 'ERROR', error: err.message });
            }
        }

        return NextResponse.json({ message: 'Additional tables migration complete', results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
