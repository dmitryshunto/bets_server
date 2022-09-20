import { ResultSetHeader, RowDataPacket } from "mysql2"
import { betKinds, database, tableNames } from "../config"
import { createConnection } from "../functions/db"
import { loadGamesUrlsToDB, loadSeasonRangeToDB, loadTeamsListToDB } from "../mysql/newChampionship"
import { League } from "../parser/newChampionship"
import { get_all_from_db, get_country_name_from_db_name, get_databases_names, get_name_of_championship_from_db_name, get_season_from_db_name } from "./db"
import { Game, Team } from "./types"
import { transformGameData } from './dto';
import { loadGameToDB } from "../mysql/loadGame"
import { getGame } from './../mysql/game';
import { Game as GameHandler } from "../mysql/prediction"
import { GamePredictableValues } from "../types/game"
import { getId } from "../mysql/common"

export const rootFunction = async () => {
    const dbNames = await get_databases_names()
    const connection = await createConnection()

    for (let dbName of dbNames) {
        const country = get_country_name_from_db_name(dbName)
        if(!country) continue
        const league = get_name_of_championship_from_db_name(dbName)
        const seasonRangeYears = get_season_from_db_name(dbName)

        await connection.query(`INSERT IGNORE INTO ${tableNames['country']} SET ?`, { country })
        const [leagues] = await connection.execute<League[]>(`SELECT league, id FROM ${tableNames['league']} WHERE country = ?`, [country])

        const leaguesNames = leagues.map(l => l.league)
        const isLeagueNameExists = leaguesNames.some((value) => value === league)
        let league_id: number
        if (!isLeagueNameExists) {
            const response = await connection.query(`INSERT INTO ${tableNames['league']} SET ?`, { country, league })
            const responseHeaders = response[0] as ResultSetHeader
            league_id = responseHeaders.insertId
        } else {
            league_id = leagues.find(item => item.league === league)?.id
        }
        if (!league_id) {
            console.log('Cannot find league ID!')
            return
        }
        const season_id = await loadSeasonRangeToDB(seasonRangeYears, league_id)

        const teamsData = await get_all_from_db<Team>(dbName, 'teams')
        const teamsList = teamsData.map(t => t.name_of_team)
        await loadTeamsListToDB(teamsList, season_id)

        const games = await get_all_from_db<Game>(dbName, 'games')
        const gamesUrls = games.map(g =>g.match_url)
        await loadGamesUrlsToDB(gamesUrls, season_id)

        for(let i = 0; i < games.length; i++) {
            const matchData = await transformGameData(games[i], dbName, season_id)
            await loadGameToDB(matchData, games[i].match_url)
            const game = await getGame('match_url', gamesUrls[i])
            const gameHandler = await GameHandler.createAsync(game.id)
            const prediction = await gameHandler.createPrediction()

            if(!prediction) continue

            const {expectedValues, outcomeBets} = prediction
            for(let betKind of betKinds) {
                const predictableValues = expectedValues[betKind] as GamePredictableValues
                if(predictableValues) await connection.query(`UPDATE ${betKind} SET ? WHERE id = ?`, [predictableValues, game.id])
                const outcomeBet = outcomeBets[betKind]
                if(outcomeBet) {
                    const {outcome_bet_type, outcome_bet_value} = outcomeBet
                    const betTypeId = await getId("bet_types", 'bet_type', outcome_bet_type)
                    const insertedData = {
                        outcome_bet_type: betTypeId,
                        outcome_bet_value
                    }
                    await connection.query(`UPDATE ${betKind} SET ? WHERE id = ?`, [insertedData, game.id])                  
                } 
            }
        }        
    }

    await connection.end()
}