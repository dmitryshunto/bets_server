import { RowDataPacket } from "mysql2";

export interface Id extends RowDataPacket {
    id: number
}

export type HomeAwayItem = 'home' | 'away'

export type FieldFactorData<D> = {
    home: D
    away: D
}

export type BetKindData<D> = {
    goals: D
    corners?: D
    yellow_cards?: D
    shots_on_goal?: D
    fouls?: D
}