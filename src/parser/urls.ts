import { Championship } from "../mysql/championsip"
import { loadGamesUrlsToDB } from "../mysql/newChampionship"
import { getMathesUrls } from "./newChampionship"

export const getMatchesUrlsForChecking = async (seasonId: number) => {
  const champ = await Championship.createAsync(seasonId)
  
  const finishedGamesUrlsFormDB = champ.finishedGamesUrls
  const finishedGamesUrlsFromSite = await getMathesUrls(champ.resultsPageUrl)

  const gamesUrlsForChecking = []

  for (let urlFromSite of finishedGamesUrlsFromSite) {
    if (finishedGamesUrlsFormDB.indexOf(urlFromSite) === -1) gamesUrlsForChecking.push(urlFromSite)
  }
  const checkedGamesNumber = 2 * champ.gamesNumbersInTour
  const fixturedGamesUrlsFromSite = await getMathesUrls(champ.fixturesPageUrl)

  fixturedGamesUrlsFromSite.reverse()
  const lastCheckedGameIndex = fixturedGamesUrlsFromSite.length < checkedGamesNumber ? fixturedGamesUrlsFromSite.length : checkedGamesNumber
  if (fixturedGamesUrlsFromSite.length) {
    for (let i = 0; i < lastCheckedGameIndex; i++) {
      gamesUrlsForChecking.push(fixturedGamesUrlsFromSite[i])
    }
  }

  const urlsForAddingToDb = []

  const gamesUrls = champ.gamesCommonInfo.map(g => g.match_url)

  // проверка на присутствие урла в базе данных, если его там нет, вставляем в базу данных
  for (let urlForCheck of gamesUrlsForChecking) {
    if (gamesUrls.indexOf(urlForCheck) === -1) {
      urlsForAddingToDb.push(urlForCheck)
    }
  }

  await loadGamesUrlsToDB(urlsForAddingToDb, seasonId)
  return gamesUrlsForChecking
}