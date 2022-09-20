import { championshipBaseUrl } from "../config"

export const getChampionshipUrl = (countryName: string, leagueName: string) => {
    return `${championshipBaseUrl}${countryName}/${leagueName}/`
}

export const getTeamListUrl = (countryName: string, champonshipName: string, season: string) => {
    return `${championshipBaseUrl}${countryName}/${champonshipName}-${season}/standings/`
}

export const getNameForUrl = (name: string) => {
    const space_reg_exp = new RegExp(' ', 'g')
    const without_space = name.replace(space_reg_exp, '-')
    const sub_reg_exp = new RegExp('_', 'g')
    return without_space.replace(sub_reg_exp, '-')
}

export const getResultsUrl = (countryName: string, champonshipName: string, season: string) => {
    return `${championshipBaseUrl}${countryName}/${champonshipName}-${season}/results/`
}

export const getFixturesUrl = (countryName: string, champonshipName: string) => {
    return `${championshipBaseUrl}${countryName}/${champonshipName}/fixtures/`
}

export const getSeasonForUrl = (start: number, end: number) => {
    return start === end ? `${start}` : `${start}-${end}`
}