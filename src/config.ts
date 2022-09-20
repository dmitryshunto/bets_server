export const user = 'dmitry'
export const password = 'dmitry'
export const host = 'localhost'
export const database = 'check_and_bet'
export const port = 3306
export const userAgent = 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13.'
const baseUrl = 'https://www.flashscore.com/'
export const championshipBaseUrl = `${baseUrl}football/`
export const matchBaseUrl = `${baseUrl}match/`

export const tableNames = {
    country: 'country',
    league: 'league',
    season: 'season',
    teams: 'teams',
    games: 'games',
    bet_kinds: 'bet_kinds',
    bet_types: 'bet_types',
    odds: 'odds',
    goals: 'goals',
    corners: 'corners',
    yellow_cards: 'yellow_cards',
    fouls: 'fouls',
    shots_on_goal: 'shots_on_goal'
} as const

export const weightOdds = {
    goals: [0.4, 0.3, 0.3],
    corners: [0.5, 0.5, 0],
    yellow_cards: [0.4, 0.4, 0.2],
    fouls: [0.4, 0.4, 0.2],
    shots_on_goal: [0.4, 0.4, 0.2]
} as const

export const lastGames = 3
export const minGamesToPredict = 1
export const basicHandicaps = {
    '2.5': [1.08, 1.15],
    '2': [1.15, 1.26],
    '1.5': [1.26, 1.5],
    '1': [1.5, 1.75],
    '0.5': [1.75, 2.3],
    '0': [2.3, 3.5]
}

export const betHandicap = {
    goals: 0.5
}

export const shotsHandicap = {
    goals: 0.5,
    corners: -2
}

export const minHandicapBeatable = 0.5

export const lowestOdd = 1.87
export const highestOdd = 2.4

export const minOdd = 1.7
export const maxOdd = 2.35

export const homeAwayItems = ['home', 'away'] as const

export const betKinds = ['goals', 'corners', 'yellow_cards', 'fouls', 'shots_on_goal'] as const