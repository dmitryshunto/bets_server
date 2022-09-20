import { Game } from "./migration/types"
// import { createPrediction } from "./mysql/prediction"
// import { getGameOddsData } from './mysql/bets'
import { rootFunction } from './migration/root';
import { transformGameData } from "./migration/dto";
import { loadBasicHandicapToDB } from "./mysql/loadGame";
import { OddData } from "./types/bets";
import { BetKindData } from "./types/common";
import { GamePredictableValues } from "./types/game";

import { Game as GameHandler } from "./mysql/prediction";

// const db = 'south_korea_k_league_1_2022'
const db1 = 'iceland_besta_deild_karla_2022'
// rootFunction()

const expectedValues = {
        goals: {
                "id": 818,
                "home": 4,
                "away": 0,
                "result": 4,
                "total": 4,
                "exp_p_home": 69,
                "exp_p_x": 25,
                "exp_p_away": 6,
                "exp_home": 2.6715,
                "exp_away": 1.08171,
                "exp_total": 3.75321,
                "exp_result": 1.58979,
                "basic_handicap": -2,
                "total_value": 3.5,
                "exp_to": 89,
                "exp_tu": 5.5
        },
        shots_on_goal: {
                "id": 818,
                "home": 4,
                "away": 0,
                "result": 4,
                "total": 4,
                "exp_p_home": 69,
                "exp_p_x": 25,
                "exp_p_away": 6,
                "exp_home": 3.6715,
                "exp_away": 1.08171,
                "exp_total": 3.75321,
                "exp_result": 1.58979,
                "basic_handicap": -2,
                "total_value": 3.5,
                "exp_to": 89,
                "exp_tu": 5.5
        }
} as BetKindData<GamePredictableValues>

// const oddsData = [
//         { bet_type: 'home', bet_kind: 'goals', odd: 1.5, value: 0 },
//         { bet_type: 'home', bet_kind: 'goals', odd: 2, value: -0.5 },
//         { bet_type: 'away', bet_kind: 'goals', odd: 4, value: -0.5 },
//         { bet_type: 'away', bet_kind: 'goals', odd: 3, value: 0 },
// ] as OddData[]

// console.log(getOutcomeBet('goals', expectedValues, oddsData))

rootFunction()

// GameHandler.createAsync(1334).then(g => {
//         g.createPrediction().then(g => {
//                 console.log(g)
//         })
// })
