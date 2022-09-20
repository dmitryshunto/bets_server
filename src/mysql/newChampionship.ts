import { ResultSetHeader, RowDataPacket } from "mysql2"
import { betKinds, tableNames } from "../config";
import { createConnection } from '../functions/db';

export const loadTeamsListToDB = async (teamsList: string[], season_id: number) => {
    const connection = await createConnection()
        for(let team of teamsList) {
            const [teamData] = await connection.execute<RowDataPacket[]>(`SELECT id FROM ${tableNames['teams']} WHERE team = ? AND season_id = ?`, [team, season_id])
            if(!teamData.length) {
                await connection.query(`INSERT INTO ${tableNames['teams']} SET ?`, {team, season_id})
            }
        }
    await connection.end()
}

export const loadGamesUrlsToDB = async (matchesUrls: string[], season_id: number) => {
    const connection = await createConnection()
    for(let match_url of matchesUrls) {
        const [matchData] = await connection.execute<RowDataPacket[]>(`SELECT id FROM ${tableNames['games']} WHERE match_url = ? AND season_id = ?`, [match_url, season_id])
        if(!matchData.length) {
            const response = await connection.query(`INSERT INTO ${tableNames['games']} SET ?`, {match_url, season_id})
            const responseHeaders = response[0] as ResultSetHeader
            const gameID = responseHeaders.insertId
            for(let tableName of betKinds) {
                await connection.query(`INSERT INTO ${tableName} SET ?`, {id: gameID})
            }
        }
    }
    await connection.end()
}

export const loadSeasonRangeToDB = async (seasonRangeYears: string[], league_id: number) => {
    if(!seasonRangeYears || seasonRangeYears.length > 2 || seasonRangeYears.length === 0) {
        console.log('Wrong season element!')
        return
    }
    let [start, end] = seasonRangeYears
    if(!end) end = start
    const connection = await createConnection()
    const [seasons] = await connection.execute<Season[]>(`SELECT id FROM ${tableNames['season']} WHERE league_id = ? AND start = ?`, [league_id, seasonRangeYears[0]])
    if(seasons.length) {
        await connection.end()
        return seasons[0].id
    } else {
        const response = await connection.query(`INSERT INTO ${tableNames['season']} SET ?`, {league_id, start, end})
        await connection.end()
        const responseHeaders = response[0] as ResultSetHeader
        return responseHeaders.insertId
    }
}

interface Season extends RowDataPacket {
    id: number
}