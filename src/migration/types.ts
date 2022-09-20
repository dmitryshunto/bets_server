import { RowDataPacket } from 'mysql2'

export interface Game extends RowDataPacket {
    game_id: number
    book_goals_w1: number | null
    book_goals_x: number | null
    book_goals_w2: number | null
    book_goals_x1: number | null
    book_goals_x2: number | null
    book_goals_h1_0: number | null
    book_goals_h2_0: number | null
    goals_basic_handicap: number | null
    goals_favorite_team: string
    goals_home_team_handicap_odd: number | null
    goals_away_team_handicap_odd: number | null
    book_goals_over_two: number | null
    book_goals_under_two: number | null
    book_goals_over_two_and_five: number | null
    book_goals_under_two_and_five: number | null
    book_goals_over_three: number | null
    book_goals_under_three: number | null
    book_goals_over_three_and_five: number | null
    book_goals_under_three_and_five: number | null
    book_goals_over_four: number | null
    book_goals_under_four: number | null
    home_team_id: number | null
    away_team_id: number | null
    home_team_goals: number | null
    away_team_goals: number | null
    home_team_yellow_cards: number | null
    away_team_yellow_cards: number | null
    home_team_corners: number | null
    away_team_corners: number | null
    home_team_shots_on_goal: number | null
    away_team_shots_on_goal: number | null
    home_team_fouls: number | null
    away_team_fouls: number | null
    date_of_match: string | null
    match_url: string
}

export interface Team extends RowDataPacket {
    team_id: number
    name_of_team: string
}