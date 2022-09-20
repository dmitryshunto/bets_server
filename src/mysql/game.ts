import moment from 'moment'
import { RowDataPacket } from 'mysql2'
import { betKinds, tableNames } from '../config'
import { getCornersBasicHandicOdds, getGoalsBasicHandicapOdds } from '../functions/bets'
import { Game } from '../types/game'
import { getGameOddsData } from './bets'
import { createConnection } from './../functions/db';

export const getGame = async (parameter: 'id' | 'match_url', value: number | string) => {
    const connection = await createConnection()    
    const [response] = await connection.execute<Game[]>(`SELECT *, DATE_FORMAT(date,'%Y-%m-%d %T') as date FROM ${tableNames.games} WHERE ${parameter} = ?`, [value])
    await connection.end()
    if(!response.length) throw new Error(`Wrong game ${parameter}!`)
    return response[0]
}

export const isGameNeedsToBeChecked = async (match_url: string) => {
    const connection = await createConnection()    
    const game = await getGame('match_url', match_url)
    const now = moment().format('YYYY-MM-DD HH:mm:ss')
    const [w1bookLineResponse] = await connection.execute<Odd[]>(`SELECT odd FROM ${tableNames.odds} WHERE game_id = ? AND bet_type = ? AND value = ?`, [game.id, 1, -0.5])
    let w1odd = null

    const [w2bookLineResponse] = await connection.execute<Odd[]>(`SELECT odd FROM ${tableNames.odds} WHERE game_id = ? AND bet_type = ? AND value = ?`, [game.id, 3, -0.5])
    await connection.end()
    let w2odd = null
    if(w1bookLineResponse.length) w1odd = w1bookLineResponse[0].odd
    if(w2bookLineResponse.length) w2odd = w2bookLineResponse[0].odd
    if(now < game.date) {
        if(w1odd && w2odd) {
            return false
        }
    }
    return true
}

interface Odd extends RowDataPacket {
    odd: number | null
}
