import { Game, Team } from './types';
import { BetData, MatchData, StatisticData, TeamDataType } from '../types/parsedMatch'
import { betKinds, homeAwayItems, lowestOdd } from '../config';
import { create_connection } from './db';
import { BetItem, BetType } from '../types/bets';
import { translate_number } from './common';
import { getCornersBasicHandicOdds, getGoalsBasicHandicapOdds } from '../functions/bets';
import { Championship } from '../mysql/championsip';

class Bet implements BetItem {
    odd: number | null
    value: number | null
    bet_type: BetType;
    constructor(bet_type: BetType, value: number | null, odd: number) {
        this.bet_type = bet_type
        this.value = value
        this.odd = odd ? odd : null
    }
}

export const transformGameData = async (game: Game, db: string, season_id: number) => {
    const connection = await create_connection(db)
    const statisticData = {} as StatisticData
    for (let team of homeAwayItems) {
        const teamDataType = {} as TeamDataType
        for (let betKind of betKinds) {
            //@ts-ignore
            teamDataType[betKind] = game[`${team}_team_${betKind}`]
        }
        const [teamInfo] = await connection.execute<Team[]>(`SELECT * FROM teams WHERE team_id = ?`, [game[`${team}_team_id`]])
        teamDataType.team_name = teamInfo.length ? teamInfo[0].name_of_team : null
        statisticData[team] = teamDataType
    }

    await connection.end()


    const champ = await Championship.createAsync(season_id)


    const date = game.date_of_match
    const isFinished = game.home_team_goals !== null ? true : false
    const goalsBets = [] as BetItem[]
    const cornersBets = [] as BetItem[]
    const yellowCardsBet = [] as BetItem[]

    const ycBasicTotal = champ.getBasicTotal('yellow_cards')
    const cornersBasicTotal = champ.getBasicTotal('corners')

    if(ycBasicTotal) {
        yellowCardsBet.push(new Bet('to', ycBasicTotal, lowestOdd))
        yellowCardsBet.push(new Bet('tu', ycBasicTotal, lowestOdd))
        yellowCardsBet.push(new Bet('home', 0.5, lowestOdd))
        yellowCardsBet.push(new Bet('away', -0.5, lowestOdd))
    } 
    if(cornersBasicTotal) {
        cornersBets.push(new Bet('to', cornersBasicTotal, lowestOdd))
        cornersBets.push(new Bet('tu', cornersBasicTotal, lowestOdd))
    }

    goalsBets.push(new Bet('home', -0.5, game.book_goals_w1))
    goalsBets.push(new Bet('x', null, game.book_goals_x))
    goalsBets.push(new Bet('away', -0.5, game.book_goals_w2))
    goalsBets.push(new Bet('home', 0.5, game.book_goals_x1))
    goalsBets.push(new Bet('away', 0.5, game.book_goals_x2))
    goalsBets.push(new Bet('home', 0, game.book_goals_h1_0))
    goalsBets.push(new Bet('away', 0, game.book_goals_h2_0))

    const goalsBasicHandicapOdds = getGoalsBasicHandicapOdds(game.book_goals_w1, game.book_goals_x, game.book_goals_w2)
    if (goalsBasicHandicapOdds) {
        const basic_handicap = goalsBasicHandicapOdds.basicHandicap
        const cornersBasicHandicCaps = getCornersBasicHandicOdds(goalsBasicHandicapOdds)
        for (let team of homeAwayItems) {
            const cornersHandicap = team === 'home' ? cornersBasicHandicCaps.basicHandicap : -cornersBasicHandicCaps.basicHandicap
            cornersBets.push(new Bet(team, cornersHandicap, cornersBasicHandicCaps.odds[team]))
            if (basic_handicap > 0.5 || basic_handicap < -0.5) {
                goalsBets.push(new Bet(team, basic_handicap, goalsBasicHandicapOdds.odds[team]))
            }
        }
    }

    for (let total = 2; total < 4.5; total = total + .5) {
        const translatedTotal = translate_number(total)
        const over = game[`book_goals_over${translatedTotal}`]
        const under = game[`book_goals_under${translatedTotal}`]
        goalsBets.push(new Bet('to', total, over))
        goalsBets.push(new Bet('tu', total, under))
    }

    const betData = {
        goals: goalsBets,
        corners: cornersBets,
        yellow_cards: yellowCardsBet
    } as BetData
    return { statisticData, isFinished, date, betData } as MatchData
}

