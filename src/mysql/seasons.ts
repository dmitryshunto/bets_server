import { Id } from '../types/common';
import { createConnection } from './../functions/db';
import { tableNames } from './../config';
import { RowDataPacket } from 'mysql2';

export const getRunningSeasons = async () => {
    const connection = await createConnection()
    const currentYear = (new Date()).getFullYear()
    const [runningSeasons] = await connection.execute<Id[]>(`SELECT id FROM ${tableNames.season} WHERE isRunning = true AND end >= ?`, [currentYear])
    await connection.end()
    return runningSeasons.map(s => s.id)
}