import { betHandicap, betKinds, highestOdd, homeAwayItems, lowestOdd, shotsHandicap, tableNames } from "../config";
import { getCornersBasicHandicOdds, getGoalsBasicHandicapFromOdds } from "../functions/bets";
import { getOpponentFieldFactor } from "../functions/common";
import { BetKind, BetType, OddData } from "../types/bets";
import { BetKindData } from "../types/common";
import { GameBets, GamePredictableValues, OutcomeBet } from "../types/game";
import { createConnection } from './../functions/db';

export const getGameOddsData = async (gameId: number) => {
    const connection = await createConnection()
    const [oddsData] = await connection.execute<OddData[]>(`
        SELECT value, odd, ${tableNames.bet_types}.bet_type, ${tableNames.bet_kinds}.bet_kind 
        FROM ${tableNames.odds}
        INNER JOIN ${tableNames.bet_types} ON ${tableNames.odds}.bet_type = ${tableNames.bet_types}.id
        INNER JOIN ${tableNames.bet_kinds} ON ${tableNames.odds}.bet_kind = ${tableNames.bet_kinds}.id
        WHERE game_id = ?
    `, [gameId])
    await connection.end()
    return oddsData
}


