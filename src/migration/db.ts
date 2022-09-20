import { createConnection } from "../functions/db"
import { RowDataPacket } from 'mysql2';
import { host, password, port, user } from "../config";
import bluebird from 'bluebird'
import mysql2 from 'mysql2/promise'


// const country_names = ['austria', 'denmark', 'greece', 'australia', 'south-korea', 'japan', 'colombia', 'egypt', 'ecuador', 'usa', 'uruguay', 'finland',
//     'mexico', 'morocco', 'paraguay', 'russia', 'portugal', 'scotland', 'spain', 'belgium', 'poland', 'turkey', 'switzerland', 'ukraine', 'argentina',
//     'chile', 'peru', 'brazil', 'china', 'norway', 'belarus', 'ireland', 'kazakhstan', 'france', 'germany', 'italy', 'england', 'netherlands',
//     'croatia', 'romania', 'serbia', 'slovakia', 'czech-republic', 'hungary', 'costa-rica', 'iceland'
// ]

const country_names = ['iceland']

export const get_country_name_from_db_name = (db_name: string) => {
    for (let country_name of country_names) {
        if (db_name.includes(get_name_for_db(country_name))) return country_name
    }
    return null
}

export const get_season_from_db_name = (db_name: string) => {
    const last_year = db_name.slice(-4)
    const prev_year = db_name.slice(-9, -5)
    if (+prev_year > 0) return [prev_year, last_year]
    return [last_year]
}

export const get_name_of_championship_from_db_name = (db_name: string) => {
    const country_name = get_country_name_from_db_name(db_name)
    const name_of_championship_and_season = db_name.substring(country_name.length + 1)
    const season = get_season_from_db_name(db_name)
    const seasonLength = season.length === 1 ? 4 : 9
    return get_name_for_url(name_of_championship_and_season.slice(0, name_of_championship_and_season.length - seasonLength - 1))
}

const get_name_for_db = (name: string) => {
    const space_reg_exp = new RegExp(' ', 'g')
    const without_space = name.replace(space_reg_exp, '_')
    const minus_reg_exp = new RegExp('-', 'g')
    return without_space.replace(minus_reg_exp, '_')
}

const get_name_for_url = (name: string) => {
    const space_reg_exp = new RegExp(' ', 'g')
    const without_space = name.replace(space_reg_exp, '-')
    const sub_reg_exp = new RegExp('_', 'g')
    return without_space.replace(sub_reg_exp, '-')
}

export const get_databases_names = async () => {
    const connection = await createConnection()

    let [databases] = await connection.execute<Database[]>('SHOW DATABASES')

    const result = databases.map(d => d.Database)

    connection.end()
    return result
}

interface Database extends RowDataPacket {
    Database: string
}

export async function get_all_from_db<D extends RowDataPacket>(database: string, table_name: string) {
    const connection = await create_connection(database)
    const [items] = await connection.execute<D[]>(`SELECT * FROM ${table_name}`)
    await connection.end()
    return items
}

export const create_connection = async (database: string) => {
    return await mysql2.createConnection({
        host, port, user, password, database, Promise: bluebird
      })
}