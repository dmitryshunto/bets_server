import { RowDataPacket } from "mysql2"

export interface GameFactValues extends RowDataPacket {
    id: number
    home: number | null
    away: number | null
    result: number | null
    total: number | null
}

export interface OutcomeBet extends RowDataPacket {
    outcome_bet_type: string | null
    outcome_bet_value: number | null
} 

export interface TotalBet extends RowDataPacket {
    total_bet_type: string | null
    total_bet_value: number | null
}

export type GameBets = TotalBet & OutcomeBet

export interface GamePredictableValues extends RowDataPacket {
    exp_p_home: number
    exp_p_x: number
    exp_p_away: number
    exp_home: number
    exp_away: number
    exp_total: number
    exp_result: number
    exp_to: number
    exp_tu: number
    total_value: number
    basic_handicap: number
}

export type GameItem = GameFactValues & GamePredictableValues & GameBets

export interface Game extends RowDataPacket {
    id: number
    season_id: number
    home_id: number | null
    away_id: number | null
    match_url: string | null
    date: string | null
    isFinished: boolean 
}