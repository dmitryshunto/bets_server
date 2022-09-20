import mysql2 from 'mysql2/promise';
import { database, host, password, port, user } from '../config';

export const createConnection = async () => {
    const connection = await mysql2.createConnection({
        host, port, user, password, database
    })
    return connection
} 