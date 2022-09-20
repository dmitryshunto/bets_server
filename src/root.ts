import { Championship } from './mysql/championsip';
import { isGameNeedsToBeChecked } from './mysql/game';
import { loadGameToDB } from './mysql/loadGame';
import { getRunningSeasons } from './mysql/seasons';
import { getMatchData } from './parser/getMatchData';
import { getMatchesUrlsForChecking } from './parser/urls';

export const serverFunction = async () => {
    const runningSeasonIds =  await getRunningSeasons()
    for(let seasonId of runningSeasonIds) {
        const championship = await Championship.createAsync(seasonId)
        const urlsForChecking = await getMatchesUrlsForChecking(seasonId)
        for(let matchUrl of urlsForChecking) {
            console.log(matchUrl)
            if(!isGameNeedsToBeChecked(matchUrl)) continue
            const parsedMatch = await getMatchData(matchUrl)
            await loadGameToDB(parsedMatch, matchUrl)
            const championship = await Championship.createAsync(seasonId)
            console.log(championship.getBasicTotal('goals'))
        }
    }
}