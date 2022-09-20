import { basicHandicaps, maxOdd, minOdd } from "../config"
import { OddData } from "../types/bets"
import { FieldFactorData } from "../types/common"

export const getGoalsBasicHandicapOdds = (homeWinOdd: number,  xOdd: number, awayWinOdd: number, margin = 0.92): HandicapData | null => {
    let basicHandicap: number

    if(homeWinOdd < 1.08 || awayWinOdd < 1.08 || !homeWinOdd || !awayWinOdd || !xOdd) return null

    let oddsRange: number[]
    const zeroHandicapOddsRange = basicHandicaps['0']

    if (isThereOddInRange(zeroHandicapOddsRange, homeWinOdd) && isThereOddInRange(zeroHandicapOddsRange, awayWinOdd)) {
        basicHandicap = 0
        oddsRange = zeroHandicapOddsRange
    }
    
    if (basicHandicap === undefined) {
        const verifiableOdds = [homeWinOdd, awayWinOdd]
        for(let oddIndex = 0; oddIndex < verifiableOdds.length; oddIndex++) {
            const verifiableOdd = verifiableOdds[oddIndex]
            for (let handicap in basicHandicaps) {
                if(+handicap === 0) continue
                const handicapOddsRange = basicHandicaps[handicap]
                if(isThereOddInRange(handicapOddsRange, verifiableOdd)) {
                    basicHandicap = oddIndex === 0 ? -handicap : +handicap
                    oddsRange = handicapOddsRange
                }
            }
        }  
    }
    
    let homeTeamOdd: number
    let awayTeamOdd: number
    
    const oddsRangeDifference = oddsRange[1] - oddsRange[0]

    if(basicHandicap === -0.5) {
        homeTeamOdd = homeWinOdd
        awayTeamOdd = 1 / (1 / xOdd + 1 / awayWinOdd)
    } else if (basicHandicap === 0.5) {
        homeTeamOdd = 1 / (1 / xOdd + 1 / homeWinOdd)
        awayTeamOdd = awayWinOdd
    } else if (basicHandicap === 0) {
        homeTeamOdd = (1 - 1 / xOdd) * homeWinOdd
        awayTeamOdd = (1 - 1 / xOdd) * awayWinOdd
    } else if (basicHandicap < 0) {    
        const oddDiff = homeWinOdd - oddsRange[0]
        homeTeamOdd = (maxOdd - minOdd) * oddDiff / oddsRangeDifference + minOdd
        awayTeamOdd = margin / (1 - 1 / homeTeamOdd)
    } else if (basicHandicap > 0) {
        const oddDiff = awayWinOdd - oddsRange[0]
        awayTeamOdd = (maxOdd - minOdd) * oddDiff / oddsRangeDifference + minOdd
        homeTeamOdd = margin / (1 - 1 / awayTeamOdd)
    }
    const odds = {
        home: homeTeamOdd,
        away: awayTeamOdd
    } as FieldFactorData<number>
    return {
        basicHandicap,
        odds 
    }
}

type HandicapData = {
    odds: FieldFactorData<number>
    basicHandicap: number
}

const cornersBasicHandicCaps = {
    '2.5': -5.5,
    '2': -4,
    '1.5': -3.5,
    '1': -2,
    '0.5': -1.5,
    '0': -0.5
}

export const getCornersBasicHandicOdds = (goalsHandicapData: HandicapData) => {
    if(!goalsHandicapData) return null
    let basicHandicap = cornersBasicHandicCaps[`${Math.abs(goalsHandicapData.basicHandicap)}`]
    if(goalsHandicapData.basicHandicap > 0) basicHandicap = -basicHandicap
    const odds = goalsHandicapData.odds
    return {
        basicHandicap, odds
    }
}

const isThereOddInRange = (range: number[], odd: number) => {
    if (odd >= range[0] && odd <= range[range.length - 1]) return true
    return false
}

export const getGoalsBasicHandicapFromOdds = (oddsData: OddData[]) => {
    const homeWinOdd = oddsData.find((odd) => odd.bet_kind === 'goals' && odd.bet_type === 'home' && odd.value === -0.5)?.odd
    const awayWinOdd = oddsData.find((odd) => odd.bet_kind === 'goals' && odd.bet_type === 'away' && odd.value === -0.5)?.odd
    const xOdd = oddsData.find((odd) => odd.bet_kind === 'goals' && odd.bet_type === 'x')?.odd
    return getGoalsBasicHandicapOdds(homeWinOdd, xOdd, awayWinOdd)

}