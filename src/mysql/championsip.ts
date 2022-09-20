import { betKinds } from "../config";
import { Game, GameItem } from "../types/game";
import { createConnection } from './../functions/db';
import { tableNames } from './../config';
import { RowDataPacket } from "mysql2";
import { HomeAwayItem, Id } from "../types/common";
import { getFixturesUrl, getResultsUrl, getSeasonForUrl } from "../functions/urlFunctions";
import { Team } from "../types/team";
import { BetKind } from "../types/bets";
import { getFinishedGames } from "../functions/common";

export class Championship {
    goals: GameItem[]
    corners: GameItem[]
    yellow_cards: GameItem[]
    fouls: GameItem[]
    shots_on_goal: GameItem[]
    gamesCommonInfo: Game[]
    finishedGamesUrls: string[]
    teams: Team[]
    seasonId: number
    seasonInfo: SeasonInfo
    seasonForUrl: string

    constructor(
        goals: GameItem[], corners: GameItem[], yellow_cards: GameItem[], fouls: GameItem[],
        shots_on_goal: GameItem[], games: Game[], seasonId: number, teams: Team[],
        seasonInfo: SeasonInfo
    ) {
        this.corners = corners
        this.fouls = fouls
        this.goals = goals
        this.shots_on_goal = shots_on_goal
        this.yellow_cards = yellow_cards
        this.gamesCommonInfo = games
        this.teams = teams
        const finishedGamesUrls = []
        this.seasonId = seasonId
        games.forEach(g => {
            if(g.isFinished) finishedGamesUrls.push(g.match_url)
        })
        this.finishedGamesUrls = finishedGamesUrls
        this.seasonInfo = seasonInfo
        this.seasonForUrl = getSeasonForUrl(seasonInfo.start, seasonInfo.end)
    }

    get resultsPageUrl() {
        const {country, league} = this.seasonInfo
        return getResultsUrl(country, league, this.seasonForUrl)
    }

    get fixturesPageUrl() {
        const {country, league} = this.seasonInfo
        return getFixturesUrl(country, league)
    }

    get gamesNumbersInTour() {
        return this.teams.length/2
    }

    getBasicTotal(betKind: BetKind) {
        const finishedGames = getFinishedGames(this[betKind])
        if(finishedGames.length < 20) return null
        const averageParameter = finishedGames.reduce((prev, curr) => prev + curr.total, 0) / finishedGames.length
        return Math.round(averageParameter / 0.5) * 0.5
    }

    getChampionshipAverageScored(team: HomeAwayItem, betKind: BetKind) {
        const finishedGames = getFinishedGames(this[betKind])
        return finishedGames.reduce((prev, curr) => prev + curr[team], 0) / finishedGames.length 
    }

    getGames(betKind: BetKind, callback: (game: GameItem) => boolean) {
        const games = this[betKind]
        return games.filter(callback)
    }

    static async createAsync(seasonId: number) {
        const connection = await createConnection()
        const result = {
            goals: [] as GameItem[],
            corners: [] as GameItem[],
            yellow_cards: [] as GameItem[],
            fouls: [] as GameItem[],
            shots_on_goal: [] as GameItem[]
        }
        const [response] = await connection.execute<Id[]>(`SELECT id FROM ${tableNames.games} WHERE season_id = ?`, [seasonId])
        const gameIds = response.map(item => item.id)
        for (let betKind of betKinds) {
            const [games] = await connection.execute<GameItem[]>(`SELECT * FROM ${betKind} WHERE id IN (${connection.escape(gameIds)})`)
            result[betKind] = games
        }
        let {goals, corners, fouls, shots_on_goal, yellow_cards} = result
        const [commonInfo] = await connection.execute<Game[]>(`SELECT * FROM ${tableNames.games} WHERE id IN (${connection.escape(gameIds)})`)
        const [teams] = await connection.execute<Team[]>(`SELECT * FROM ${tableNames.teams} WHERE season_id = ?`, [seasonId])
        const [season] = await connection.execute<SeasonInfo[]>(`
            SELECT ${tableNames.league}.country, ${tableNames.league}.league, start, end 
            FROM ${tableNames.season}
            INNER JOIN ${tableNames.league} ON ${tableNames.season}.league_id = ${tableNames.league}.id
            WHERE ${tableNames.season}.id = ?
        `, [seasonId])
        const seasonInfo = season[0]
        await connection.end()
        return new this(goals, corners, yellow_cards, fouls, shots_on_goal, commonInfo, seasonId, teams, seasonInfo)
    }
}

interface SeasonInfo extends RowDataPacket {
    country: string
    league: string
    start: number
    end: number
}