import { ResultSetHeader, RowDataPacket } from 'mysql2';
import puppy from 'puppeteer'
import { getChampionshipUrl, getFixturesUrl, getNameForUrl, getResultsUrl, getTeamListUrl } from '../functions/urlFunctions'
import { tableNames, userAgent } from '../config'
import { createConnection } from '../functions/db';
import { loadGamesUrlsToDB, loadSeasonRangeToDB, loadTeamsListToDB } from '../mysql/newChampionship';

const getTeamList = async (teamListPageUrl: string): Promise<string[]> => {
    const browser = await puppy.launch({ headless: true })
    const teamListPage = await browser.newPage()
    await teamListPage.setUserAgent(userAgent)
    teamListPage.setDefaultNavigationTimeout(0)
    await teamListPage.goto(teamListPageUrl)
    console.log(teamListPageUrl)
    const team_list = await teamListPage.evaluate(() => {
      const teams_list = document.querySelectorAll('a.tableCellParticipant__name')
      const result = []
      for (const team_name of teams_list) {
        result.push(team_name.innerHTML)
      }
      return result
    })
    await teamListPage.close()
    await browser.close()
    return team_list
}

export const getMathesUrls = async (url: string): Promise<string[]> => {
    const browser = await puppy.launch({ headless: true })
    const page = await browser.newPage()
    await page.setUserAgent(userAgent)
    page.setDefaultNavigationTimeout(0)
    await page.goto(url)

    const trustBtnSelector = 'button[id = "onetrust-accept-btn-handler"]'

    if (await page.$(trustBtnSelector)) {
      await page.click(trustBtnSelector)
    }

    const moreBtnSelector = 'a[class = "event__more event__more--static"]'

    do {
      if (await page.$(moreBtnSelector)) {
        await page.click(moreBtnSelector)
        // await common_function.sleep(5)
      }
    } while (await page.$(moreBtnSelector) !== null)

    const matches_id_list = await page.$$eval('div[title = "Click for match detail!"]', (elements) => {
      const data = []
      for (let i = 0; i < elements.length; i++) {
        const match_id = elements[i].id.substr(4)
        data.push(match_id)
      }
      return data
    })
    await page.close()
    await browser.close()
    return matches_id_list.reverse()
}

const loadTeamsToDB = async (seasonForUrl: string, countryName: string, championshipName: string, season_id: number) => {
    const championshipNameForUrl = getNameForUrl(championshipName)
    const teamListPageUrl = getTeamListUrl(countryName, championshipNameForUrl, seasonForUrl)
    const teamsList = await getTeamList(teamListPageUrl)
    console.log(teamsList)
    await loadTeamsListToDB(teamsList, season_id)
}

const loadGamesToDB = async (countryName: string, championshipName: string, seasonForUrl: string, season_id: number) => {
    const championshipResultsPageUrl = getResultsUrl(countryName, championshipName, seasonForUrl)
    const fixturesPageUrl = getFixturesUrl(countryName, championshipName)
    const finishedMatchUrlList = await getMathesUrls(championshipResultsPageUrl)
    const upcomingMatchUrlList = await getMathesUrls(fixturesPageUrl)
    upcomingMatchUrlList.reverse()
    const matchUrls = [...finishedMatchUrlList, ...upcomingMatchUrlList]
    console.log(matchUrls.length)
    await loadGamesUrlsToDB(matchUrls, season_id)
}

export const createChampionship = async (country: string, championshipName: string) => {
    const connection = await createConnection()
    await connection.query(`INSERT IGNORE INTO ${tableNames['country']} SET ?`, {country})
    const [leagues] = await connection.execute<League[]>(`SELECT league, id FROM ${tableNames['league']} WHERE country = ?`, [country])
    const leaguesNames = leagues.map(l => l.league)
    const isLeagueNameExists = leaguesNames.some((value) => value === championshipName)
    let league_id: number
    if(!isLeagueNameExists) {
        const response = await connection.query(`INSERT INTO ${tableNames['league']} SET ?`, {country, league: championshipName})
        const responseHeaders = response[0] as ResultSetHeader
        league_id = responseHeaders.insertId
    } else {
        league_id = leagues.find(item => item.league === championshipName)?.id
    }
    if(!league_id) {
        console.log('Cannot find league ID!')
        return
    }

    const browser = await puppy.launch({ headless: true })

    const championshipPage = await browser.newPage()
    await championshipPage.setUserAgent(userAgent)
    championshipPage.setDefaultNavigationTimeout(0)
    await championshipPage.goto(getChampionshipUrl(country, championshipName))
    
    let seasonForUrl = await championshipPage.evaluate(() => {
        return document.querySelector('.heading__info').innerHTML.replace('/', '-')
    })
    if(!seasonForUrl) {
        console.log('Cannot find season element!')
        return
    }
    const seasonRangeYears = seasonForUrl.split('-')
        
    const season_id = await loadSeasonRangeToDB(seasonRangeYears, league_id)
    await loadTeamsToDB(seasonForUrl, country, championshipName, season_id)
    await loadGamesToDB(country, championshipName, seasonForUrl, season_id)
    await browser.close()
    await connection.end()
  }

export interface League extends RowDataPacket {
    league: string
    id: number
}