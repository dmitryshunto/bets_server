import { HomeAwayItem } from "../types/common"
import { GameItem } from '../types/game'

export const sleep = (s: number) => new Promise((res) => {
    setTimeout(res, s * 1000)
})

export const convertDate = (date: string) => {
    const day = date.substring(0, 2)
    const month = date.substring(3, 5)
    const year = date.substring(6, 10)
    const hours = date.substring(11, 13)
    const minutes = date.substring(14)
    return `${year}-${month}-${day} ${hours}:${minutes}`
}

export const getOpponentFieldFactor = (homeAwayItem: HomeAwayItem): HomeAwayItem => {
    return homeAwayItem === 'home' ? 'away' : 'home'
}

export const getFinishedGames = (games: GameItem[]) => {
    const result = [] as GameItem[]
    games.forEach(g => {
        if(g.total !== null) result.push(g)
    })
    return result
}