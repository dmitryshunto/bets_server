import { betHandicap, betKinds, highestOdd, homeAwayItems, lastGames, lowestOdd, minGamesToPredict, minHandicapBeatable, shotsHandicap, weightOdds } from '../config';
import { BetKind, BetType, OddData } from '../types/bets';
import { GameItem, GamePredictableValues, OutcomeBet } from '../types/game';
import { createConnection } from './../functions/db';
import { getGame } from './game';
import { tableNames } from './../config';
import { BetKindData, FieldFactorData, HomeAwayItem, Id } from '../types/common';
import { getFinishedGames, getOpponentFieldFactor } from '../functions/common';
import { TotalData } from '../types/prediction'
import { Championship } from './championsip'

export class Game {
    teamsGames: TeamsGames
    championship: Championship
    gameId: number

    constructor(teamsGames: TeamsGames, championship: Championship, gameId: number) {
        this.teamsGames = teamsGames
        this.championship = championship
        this.gameId = gameId
    }

    async createPrediction() {
        if(!this._isReadyToPrediction) return null
        const expectedValues = this._getExpectedValues()
        const oddData = await this._getGameOddsData()
        const outcomeBets = this._getOutcomeBet(expectedValues, oddData)
        return {
            outcomeBets,
            expectedValues
        }
    }

    async _getGameOddsData () {
        const connection = await createConnection()
        const [oddsData] = await connection.execute<OddData[]>(`
            SELECT value, odd, ${tableNames.bet_types}.bet_type, ${tableNames.bet_kinds}.bet_kind 
            FROM ${tableNames.odds}
            INNER JOIN ${tableNames.bet_types} ON ${tableNames.odds}.bet_type = ${tableNames.bet_types}.id
            INNER JOIN ${tableNames.bet_kinds} ON ${tableNames.odds}.bet_kind = ${tableNames.bet_kinds}.id
            WHERE game_id = ?
        `, [this.gameId])
        await connection.end()
        return oddsData
    }

    _getOutcomeBet(expectedValues: BetKindData<GamePredictableValues>, oddsData: OddData[]) {
        const outcomeBets = {} as BetKindData<OutcomeBet>
        for (let betKind of betKinds) {
            const betKindData = expectedValues[betKind]
            let outcome_bet_type: BetType | null = null
            let outcome_bet_value: number | null = null
            for (let oddData of oddsData) {
                if (oddData.odd === null || oddData.bet_kind !== betKind) continue
                if (oddData.bet_type === 'home' || oddData.bet_type === 'away') {
                    const team = oddData.bet_type
                    const oppTeam = getOpponentFieldFactor(team)
                    let handicap: number
                    if (oddData.value < -1 && oddData.value > -2) {
                        handicap = oddData.value - 0.5
                    } else if (oddData.value <= -2) {
                        handicap = oddData.value - 1
                    } else {
                        handicap = oddData.value
                    }
                    const expRes = betKindData[`exp_${team}`] - betKindData[`exp_${oppTeam}`]
                    const expResultWithHC = expRes + handicap

                    
                    let shotsFactor = true
                    let handicapFactor = true

                    if (betKind === 'corners' || betKind === 'goals') {
                        const shotOnGoalsData = expectedValues['shots_on_goal']
                        if (shotOnGoalsData) {
                            const expShotsRes = shotOnGoalsData[`exp_${team}`] - shotOnGoalsData[`exp_${oppTeam}`] - shotsHandicap[betKind]
                            if (expShotsRes < expRes) shotsFactor = false

                            const teamHandicapData = this._getTeamBeatenHandicap(team, betKind)
                            const oppTeamHandicapData = this._getTeamBeatenHandicap(oppTeam, betKind)

                            if (teamHandicapData && oppTeamHandicapData &&
                                (teamHandicapData[team] + oppTeamHandicapData[team]) / 2 < minHandicapBeatable) handicapFactor = false

                        } else shotsFactor = false
                    }

                    if (expResultWithHC > betHandicap[betKind] && oddData.odd > lowestOdd
                        && oddData.odd < highestOdd
                        && shotsFactor
                        && handicapFactor) {
                        outcome_bet_type = oddData.bet_type
                        outcome_bet_value = oddData.value
                    }
                }
            }
            if (outcome_bet_type && outcome_bet_value !== null) outcomeBets[betKind] = { outcome_bet_type, outcome_bet_value } as OutcomeBet
        }
        return outcomeBets
    }

    _getTotalBet(expectedValues: BetKindData<GamePredictableValues>, oddsData: OddData[]) {
        
    }

    _getTeamBeatenHandicap(team: HomeAwayItem, betKind: BetKind) {
        const oppTeam = getOpponentFieldFactor(team)
        const teamGames = this.teamsGames[team][betKind]
        let beatenHandicapMatches = 0
        let returnedHandicapMatches = 0
        let unbeatenHandicapMatches = 0
        teamGames.forEach(g => {
            if (g.basic_handicap === null || g[team] === null || g[oppTeam] === null) return
            let handiap = team === 'home' ? g.basic_handicap : -g.basic_handicap
            const resultWithHC = g[team] + handiap
            if (resultWithHC > g[oppTeam]) {
                beatenHandicapMatches++
            } else if (resultWithHC === g[oppTeam]) {
                returnedHandicapMatches++
            } else {
                unbeatenHandicapMatches++
            }
        })
        const allGames = beatenHandicapMatches + unbeatenHandicapMatches
        if (!allGames) return null
        return {
            [team]: beatenHandicapMatches / allGames,
            [oppTeam]: unbeatenHandicapMatches / allGames
        }
    }

    _getExpectedValues(): BetKindData<GamePredictableValues> {
        const gameExpectedValues = {} as BetKindData<GamePredictableValues>
        for (let betKind of betKinds) {
            const teamsStatistic = this._getTeamsStatistic(betKind)
            if (!this._isReadyToPrediction || !teamsStatistic) continue
            const exp_p_home = Math.round((teamsStatistic.home.averageWin + teamsStatistic.away.averageLose) / 2)
            const exp_p_away = Math.round((teamsStatistic.home.averageLose + teamsStatistic.away.averageWin) / 2)
            const exp_p_x = 100 - exp_p_home - exp_p_away
            const expectedTeamsInidividualTotals = {} as { exp_home: number, exp_away: number }
            const totalStatistic = {} as FieldFactorData<TotalData>

            for (let team of homeAwayItems) {
                const leagueAverageScored = this.championship.getChampionshipAverageScored(team, betKind)
                const oppTeam = getOpponentFieldFactor(team)
                const predictionItems = [
                    (teamsStatistic[team].scored + teamsStatistic[oppTeam].missed) / 2,
                    (teamsStatistic[team].scored * teamsStatistic[oppTeam].missed / leagueAverageScored),
                    (teamsStatistic[team].currentScored + teamsStatistic[oppTeam].currentMissed) / 2
                ]
                expectedTeamsInidividualTotals[`exp_${team}`] = 0
                for (let i = 0; i < weightOdds[betKind].length; i++) {
                    expectedTeamsInidividualTotals[`exp_${team}`] += predictionItems[i] * weightOdds[betKind][i]
                }
                totalStatistic[team] = this._getTotalStatistic(team, leagueAverageScored, betKind)
            }
            const exp_to = (totalStatistic.home.to + totalStatistic.away.to) / 2
            const exp_tu = (totalStatistic.home.tu + totalStatistic.away.tu) / 2
            const { exp_home, exp_away } = expectedTeamsInidividualTotals
            const exp_total = exp_home + exp_away
            const exp_result = exp_home - exp_away

            const total_value = this.championship.getBasicTotal(betKind)

            const result = { exp_home, exp_away, exp_result, exp_total, exp_p_home, exp_p_away, exp_p_x, exp_to, exp_tu, total_value } as GamePredictableValues
            gameExpectedValues[betKind] = result    
        }
        return gameExpectedValues
    }

    _getLastGames(team: HomeAwayItem, betKind: BetKind, lastGames?: number) {
        let games = [] as GameItem[]
        if (!lastGames || lastGames >= this.teamsGames[team][betKind].length) {
            games = this.teamsGames[team][betKind]
        } else {
            games = [...this.teamsGames[team][betKind]].splice(-lastGames)
        }
        return games
    }

    _getPercentageOutcome(team: HomeAwayItem, outcome: HomeAwayItem, betKind: BetKind) {
        const games = getFinishedGames(this.teamsGames[team][betKind])
        const oppFieldFactor = getOpponentFieldFactor(outcome)
        return 100 * (games.filter(g => g[outcome] > g[oppFieldFactor]).length / games.length)
    }

    _getTotalStatistic(team: HomeAwayItem, total: number, betKind: BetKind, lastGames?: number): TotalData {
        const games = this._getLastGames(team, betKind, lastGames)
        const to = Math.round(100 * games.filter(g => {
            if (g.total !== null && g.total > total) return true
            return false
        }).length / games.length)
        const tu = Math.round(100 * games.filter(g => {
            if (g.total !== null && g.total < total) return true
            return false
        }).length / games.length)
        const exact = 100 - tu - to
        return { to, tu, exact }
    }

    _getAverageIndividualTotal(team: HomeAwayItem, whoScored: HomeAwayItem, betKind: BetKind, lastGames?: number) {
        let games = this._getLastGames(team, betKind, lastGames)
        let isParameterValid = false
        let numberOfValidGames = 0
        let sum = 0
        games.forEach(g => {
            if (g[whoScored] !== null) {
                isParameterValid = true
                sum += g[whoScored]
                numberOfValidGames++
            }
        })
        if (isParameterValid) return sum / numberOfValidGames
        return null
    }

    get _isReadyToPrediction() {
        if (this.teamsGames.home.goals.length > minGamesToPredict && this.teamsGames.away.goals.length > minGamesToPredict) return true
        return false
    }

    _getTeamsStatistic(betKind: BetKind) {
        const teamsStatistic = {} as TeamsStatistic

        for (let team of homeAwayItems) {
            const oppTeam = getOpponentFieldFactor(team)
            const scored = this._getAverageIndividualTotal(team, team, betKind)
            if (scored === null) return null
            const currentScored = this._getAverageIndividualTotal(team, team, betKind, lastGames)
            const averageWin = this._getPercentageOutcome(team, team, betKind)
            const averageLose = this._getPercentageOutcome(team, oppTeam, betKind)

            const missed = this._getAverageIndividualTotal(team, oppTeam, betKind)
            const currentMissed = this._getAverageIndividualTotal(team, oppTeam, betKind, lastGames)
            const teamData = { scored, currentScored, missed, currentMissed, averageWin, averageLose } as Team
            teamsStatistic[team] = teamData
        }

        return teamsStatistic
    }

    static async createAsync(gameId: number) {
        const game = await getGame('id', gameId)
        const championship = await Championship.createAsync(game.season_id)

        const connection = await createConnection()

        const teamsGames = {} as TeamsGames
        for (let homeAwayItem of homeAwayItems) {
            const data = {} as BetKindData<GameItem[]>
            for (let betKind of betKinds) {
                const [games] = await connection.execute<GameItem[]>(
                    `SELECT ${betKind}.* 
                        FROM ${tableNames.games} 
                        INNER JOIN ${tableNames[betKind]} ON 
                        ${tableNames.games}.id = ${tableNames[betKind]}.id
                         WHERE ${homeAwayItem}_id = ? AND season_id = ? AND ${tableNames.games}.id < ?
                    `,
                    [game[`${homeAwayItem}_id`], game.season_id, gameId])
                data[betKind] = games
            }
            teamsGames[homeAwayItem] = data
        }
        await connection.end()
        return new this(teamsGames, championship, gameId)
    }
}

type Team = {
    scored: number
    currentScored: number
    missed: number
    currentMissed: number
    averageWin: number
    averageLose: number
}

type TeamsStatistic = {
    home: Team
    away: Team
}

type TeamsGames = FieldFactorData<BetKindData<GameItem[]>>