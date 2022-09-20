export type BetType = 'home' | 'away' | 'x' | 'to' | 'tu'
import { RowDataPacket } from 'mysql2';
export type BetKind = 'goals' | 'corners' | 'yellow_cards' | 'fouls' | 'shots_on_goal'

export type BetItem = {
    bet_type: BetType
    value: number | null
    odd: number | null
    isBasicHandicap?: boolean
}

export interface OddData extends RowDataPacket  {
    bet_kind: BetKind
    bet_type: BetType
    value: number | null
    odd: number | null
}

export type BetDataItem = BetItem[]