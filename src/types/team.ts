import { RowDataPacket } from "mysql2";

export interface Team extends RowDataPacket {
    id: number
    team: string
    season_id: number
}