import { MatchData, TeamDataType } from '../types/parsedMatch'
import { createConnection } from './../functions/db';
import { betKinds, homeAwayItems, tableNames } from './../config';
import moment from 'moment';
import { convertDate } from '../functions/common';
import { BetDataItem, BetKind, BetType } from '../types/bets';
import { Id } from '../types/common';
import { getGame } from './game'
import { getId } from './common';
import { getGameOddsData } from './bets';
import { getCornersBasicHandicOdds, getGoalsBasicHandicapFromOdds, getGoalsBasicHandicapOdds } from '../functions/bets';

export const loadGameToDB = async (matchData: MatchData, matchUrl: string) => {
    const connection = await createConnection()
    try {
        const game = await getGame('match_url', matchUrl)

        const gameId = game.id
        const season_id = game.season_id

        // const date = moment(convertDate(matchData.date)).format('YYYY-MM-DD HH:mm')
        const date = matchData.date ? moment(matchData.date).format('YYYY-MM-DD') : null

        await connection.query(`UPDATE ${tableNames['games']} SET ? WHERE id = ?`, [{ date, isFinished: matchData.isFinished }, gameId])
        for (let homeAwayItem of homeAwayItems) {
            const teamData = matchData.statisticData[homeAwayItem] as TeamDataType
            const teamName = teamData.team_name
            const [response] = await connection.execute<Id[]>(`SELECT id FROM ${tableNames['teams']} WHERE team = ? AND season_id = ?`, [teamName, season_id])
            let teamId = null as number | null
            if (response.length) teamId = response[0].id

            await connection.query(`UPDATE ${tableNames['games']} SET ? WHERE id = ?`, [{ [`${homeAwayItem}_id`]: teamId }, gameId])

            if (!teamData) continue
            for (let betKind of betKinds) {
                if (matchData.isFinished) await connection.query(`UPDATE ${betKind} SET ? WHERE id = ?`, [{ [homeAwayItem]: teamData[betKind] }, gameId])
            }
        }

        for (let betKind in matchData.betData) {
            const betData = matchData.betData[betKind] as BetDataItem
            const betKindId = await getId(tableNames.bet_kinds, 'bet_kind', betKind)
            for (let betItem of betData) {
                let { bet_type, odd, value } = betItem
                const betTypeId = await getId(tableNames.bet_types, 'bet_type', bet_type)

                const sqlCommonPart = `
                        SELECT odd, ${tableNames.odds}.id 
                        FROM ${tableNames.odds}
                        INNER JOIN bet_types ON ${tableNames.odds}.bet_type = ${tableNames.bet_types}.id
                        INNER JOIN bet_kinds ON ${tableNames.odds}.bet_kind = ${tableNames.bet_kinds}.id
                        WHERE ${tableNames.bet_types}.bet_type = ? AND ${tableNames.bet_kinds}.bet_kind = ? 
                        AND game_id = ? AND value `
                let requestParams = [bet_type, betKind, gameId]

                let additionalSqlPart: string

                if(bet_type === 'x') {
                    additionalSqlPart = 'IS NULL'
                } else {
                    additionalSqlPart = '= ?'
                    requestParams.push(value)
                }
                
                const sqlRequest = sqlCommonPart + additionalSqlPart

                const [existingBet] = await connection.execute<ExistingBet[]>(sqlRequest, requestParams)
                if (!existingBet.length) {
                    await connection.query(`INSERT INTO ${tableNames.odds} SET ?`, [{ game_id: gameId, bet_kind: betKindId, bet_type: betTypeId, odd, value }])
                    continue
                }
                if (existingBet.length && !existingBet[0].odd) {
                    await connection.query(`UPDATE ${tableNames.odds} SET ? WHERE id = ?`, [{ odd }, existingBet[0].id])
                }
            }

        }
        await loadBasicHandicapToDB(matchUrl)
        await connection.end()
    } catch (e) {
        console.log(e)
        await connection.end()
    }

}

export const loadBasicHandicapToDB = async (match_url: string) => {
    const game = await getGame('match_url', match_url)
    const game_id = game.id

    const oddsData = await getGameOddsData(game_id)

    const goalsHandicapData = getGoalsBasicHandicapFromOdds(oddsData)

    const connection = await createConnection()


    for(let betKind of betKinds) {
        let basic_handicap: number | null = null
        if(betKind === 'goals') {
            basic_handicap =  goalsHandicapData ? goalsHandicapData.basicHandicap : null            
        } 
        if(betKind === 'corners') {
            const cornersBasicHandicapData = getCornersBasicHandicOdds(goalsHandicapData)
            basic_handicap = cornersBasicHandicapData ? cornersBasicHandicapData.basicHandicap : null
        }
        if(betKind === 'yellow_cards') basic_handicap = 0.5
        await connection.query(`UPDATE ${betKind} SET ? WHERE id = ?`, [{basic_handicap}, game_id])
    }
    await connection.end()
}


interface ExistingBet extends Id {
    value: number | null
    odd: number | null
    game_id: number
    bet_kind: BetKind
    bet_type: BetType
}