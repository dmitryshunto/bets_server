import { tableNames } from "../config";
import { Id } from "../types/common";
import { createConnection } from './../functions/db';

export const getId = async (tableName: keyof typeof tableNames, parameter: string, value: any) => {
    const connection = await createConnection()
    const [response] = await connection.execute<Id[]>(`SELECT id FROM ${tableName} WHERE ${parameter} = ?`, [value])
    await connection.end()
    if(!response.length) throw new Error(`Wrong ${parameter}!`)
    return response[0].id
}
