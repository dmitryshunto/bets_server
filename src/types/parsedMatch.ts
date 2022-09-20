import { BetDataItem } from "./bets"

export type TeamDataType = {
    team_name: string,
    goals: string,
    corners: string,
    yellow_cards: string,
    fouls: string,
    shots_on_goal: string
}

export type StatisticData = {
    home: TeamDataType
    away: TeamDataType
}

export type BetData = {
    goals: BetDataItem
}

export type MatchData = {
    statisticData: StatisticData
    betData: BetData
    isFinished: boolean
    date: string
}