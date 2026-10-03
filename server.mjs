import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const app = express();

// ============================================================
// COURTSIDE DEVELOPMENT API
// ============================================================
// Disable browser/proxy caching so Angular always receives
// fresh JSON. Server-side player-detail caching is handled
// separately below.
// ============================================================

app.disable("etag");

app.use((req, res, next) => {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next();
});

const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_ROOT = path.join(
    __dirname,
    "dist",
    "courtside-angular-temp"
);

const BROWSER_DIST = fs.existsSync(
    path.join(DIST_ROOT, "browser")
)
    ? path.join(DIST_ROOT, "browser")
    : DIST_ROOT;




const NBA_BASE = "https://stats.nba.com/stats";

const NBA_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.nba.com",
    "Referer": "https://www.nba.com/",
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true"
};

// ============================================================
// SEASON
// ============================================================

function currentSeason() {

    const now = new Date();

    const year = now.getUTCFullYear();

    // NBA season begins in the fall.
    // October 2026 -> 2026-27
    // January 2027 -> 2026-27

    const startYear =
        now.getUTCMonth() >= 9
            ? year
            : year - 1;

    return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

// ============================================================
// DATE VALIDATION
// ============================================================

function dateString(value) {

    if (!value) {
        return new Date().toISOString().slice(0, 10);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("Invalid date. Expected YYYY-MM-DD.");
    }

    return value;
}

// ============================================================
// BASIC NBA FETCH
// ============================================================

async function nbaFetch(endpoint, params = {}, timeoutMs = 0) {

    const url =
        new URL(`${NBA_BASE}/${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    let controller = null;
    let timeout = null;

    if (timeoutMs > 0) {

        controller =
            new AbortController();

        timeout =
            setTimeout(() => {
                controller.abort();
            }, timeoutMs);
    }

    try {

        const response =
            await fetch(url, {
                method: "GET",
                headers: NBA_HEADERS,
                signal: controller?.signal
            });

        if (!response.ok) {

            const error =
                new Error(
                    `NBA request failed: ${response.status} ${response.statusText}`
                );

            error.status = response.status;

            error.retryable =
                [
                    429,
                    500,
                    502,
                    503,
                    504
                ].includes(response.status);

            throw error;
        }

        return await response.json();

    } catch (error) {

        if (error?.name === "AbortError") {

            const timeoutError =
                new Error(
                    "NBA request timed out."
                );

            timeoutError.name =
                "TimeoutError";

            timeoutError.status = 504;
            timeoutError.retryable = true;

            throw timeoutError;
        }

        throw error;

    } finally {

        if (timeout) {
            clearTimeout(timeout);
        }
    }
}

// ============================================================
// RESULT SET HELPERS
// ============================================================

function resultSet(json, name) {

    const set =
        json?.resultSets?.find(
            item => item.name === name
        );

    if (!set) {
        return [];
    }

    return set.rowSet.map(row => {

        const object = {};

        set.headers.forEach(
            (header, index) => {
                object[header] = row[index];
            }
        );

        return object;
    });
}

function firstResultSet(json) {

    const set =
        json?.resultSets?.[0] ??
        json?.resultSet;

    if (!set) {
        return [];
    }

    return set.rowSet.map(row => {

        const object = {};

        set.headers.forEach(
            (header, index) => {
                object[header] = row[index];
            }
        );

        return object;
    });
}

// ============================================================
// PLAYER DETAIL RESILIENCE CONFIGURATION
// ============================================================

const PLAYER_CACHE_FRESH_MS =
    2 * 60 * 1000; // 2 minutes

const PLAYER_CACHE_STALE_MS =
    30 * 60 * 1000; // 30 minutes

const NBA_REQUEST_TIMEOUT_MS =
    8 * 1000; // 8 seconds

const NBA_MAX_RETRIES =
    2; // two retries after first attempt

const NBA_RETRY_BASE_MS =
    250;

// In-memory cache.
//
// Key:
// player:{PERSON_ID}:{season}
//
// Example:
// player:1630162:2026-27
//
const playerDetailCache =
    new Map();

// Active upstream requests.
//
// This prevents multiple simultaneous visitors from
// generating multiple identical NBA requests.
//
const playerDetailInflight =
    new Map();

// ============================================================
// RETRY HELPERS
// ============================================================

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}

function isRetryableStatus(status) {

    return [
        429,
        500,
        502,
        503,
        504
    ].includes(Number(status));
}

function isRetryableError(error) {

    if (!error) {
        return false;
    }

    if (error.name === "AbortError") {
        return true;
    }

    if (error.name === "TimeoutError") {
        return true;
    }

    if (error.retryable === true) {
        return true;
    }

    return isRetryableStatus(
        error.status
    );
}

// ============================================================
// NBA FETCH WITH RETRY
// ============================================================

async function nbaFetchWithRetry(
    endpoint,
    params = {}
) {

    let lastError = null;

    for (
        let attempt = 0;
        attempt <= NBA_MAX_RETRIES;
        attempt++
    ) {

        try {

            return await nbaFetch(
                endpoint,
                params,
                NBA_REQUEST_TIMEOUT_MS
            );

        } catch (error) {

            lastError = error;

            const canRetry =
                attempt < NBA_MAX_RETRIES &&
                isRetryableError(error);

            if (!canRetry) {
                throw error;
            }

            const exponentialDelay =
                NBA_RETRY_BASE_MS *
                Math.pow(2, attempt);

            const jitter =
                Math.floor(
                    Math.random() * 150
                );

            const delay =
                exponentialDelay +
                jitter;

            console.warn(
                `[COURTSIDE] NBA retry ` +
                `${attempt + 1}/${NBA_MAX_RETRIES} ` +
                `for ${endpoint} ` +
                `after ${delay}ms`
            );

            await sleep(delay);
        }
    }

    throw lastError;
}

// ============================================================
// PLAYER CACHE HELPERS
// ============================================================

function getPlayerCacheKey(
    personId,
    season
) {

    return `player:${personId}:${season}`;
}

function getPlayerCacheEntry(
    cacheKey
) {

    return (
        playerDetailCache.get(cacheKey) ??
        null
    );
}

function isFreshCache(entry) {

    if (!entry) {
        return false;
    }

    return (
        Date.now() <
        entry.freshUntil
    );
}

function isStaleEligible(entry) {

    if (!entry) {
        return false;
    }

    const now =
        Date.now();

    return (
        now >= entry.freshUntil &&
        now < entry.staleUntil
    );
}

function storePlayerCache(
    cacheKey,
    value
) {

    const cachedAt =
        Date.now();

    const entry = {

        value,

        cachedAt,

        freshUntil:
            cachedAt +
            PLAYER_CACHE_FRESH_MS,

        staleUntil:
            cachedAt +
            PLAYER_CACHE_STALE_MS
    };

    playerDetailCache.set(
        cacheKey,
        entry
    );

    return entry;
}

// ============================================================
// PLAYER DETAIL UPSTREAM FETCH
// ============================================================

async function fetchPlayerDetailFromNBA(
    personId,
    season
) {

    console.log(
        `[COURTSIDE] Fetching NBA player detail ` +
        `${personId} ${season}`
    );

    const [
        playerInfoResponse,
        careerStatsResponse
    ] =
        await Promise.all([

            nbaFetchWithRetry(
                "commonplayerinfo",
                {
                    LeagueID: "00",
                    PlayerID: personId
                }
            ),

            nbaFetchWithRetry(
                "playercareerstats",
                {
                    LeagueID: "00",
                    PlayerID: personId,
                    PerMode: "PerGame"
                }
            )

        ]);

    const playerInfoRows =
        resultSet(
            playerInfoResponse,
            "CommonPlayerInfo"
        );

    const seasonStatsRows =
        resultSet(
            careerStatsResponse,
            "SeasonTotalsRegularSeason"
        );

    const player =
        playerInfoRows.length > 0
            ? playerInfoRows[0]
            : null;

    // --------------------------------------------------------
    // No player returned.
    //
    // This is a genuine not-found condition, NOT a transient
    // upstream failure, so it must not be retried or served
    // from stale cache.
    // --------------------------------------------------------

    if (!player) {

        const error =
            new Error(
                `Player ${personId} was not found.`
            );

        error.status = 404;
        error.retryable = false;

        throw error;
    }

    return {

        ok: true,

        personId:
            String(personId),

        season,

        dataStatus:
            "fresh",

        cached:
            false,

        cachedAt:
            null,

        staleAgeSeconds:
            0,

        player,

        seasonStats:
            Array.isArray(seasonStatsRows)
                ? seasonStatsRows
                : []
    };
}

// ============================================================
// PLAYER DETAIL CACHE + REQUEST COALESCING
// ============================================================

async function getPlayerDetail(
    personId,
    season
) {

    const cacheKey =
        getPlayerCacheKey(
            personId,
            season
        );

    // --------------------------------------------------------
    // 1. FRESH CACHE
    // --------------------------------------------------------

    const cached =
        getPlayerCacheEntry(
            cacheKey
        );

    if (isFreshCache(cached)) {

        return {

            ...cached.value,

            dataStatus:
                "fresh",

            cached:
                true,

            cachedAt:
                new Date(
                    cached.cachedAt
                ).toISOString(),

            staleAgeSeconds:
                0
        };
    }

    // --------------------------------------------------------
    // 2. REQUEST COALESCING
    // --------------------------------------------------------
    //
    // Another request for the exact same player/season is
    // already talking to the NBA.
    //
    // Wait for that request instead of creating another one.
    // --------------------------------------------------------

    if (
        playerDetailInflight.has(
            cacheKey
        )
    ) {

        console.log(
            `[COURTSIDE] Joining in-flight ` +
            `player request ${cacheKey}`
        );

        return await
            playerDetailInflight.get(
                cacheKey
            );
    }

    // --------------------------------------------------------
    // 3. CREATE ONE UPSTREAM REQUEST
    // --------------------------------------------------------

    const requestPromise =
        (async () => {

            try {

                const freshData =
                    await
                        fetchPlayerDetailFromNBA(
                            personId,
                            season
                        );

                const cacheEntry =
                    storePlayerCache(
                        cacheKey,
                        freshData
                    );

                console.log(
                    `[COURTSIDE] Cached player ` +
                    `${personId} for ` +
                    `${PLAYER_CACHE_FRESH_MS / 1000}s`
                );

                return {

                    ...freshData,

                    dataStatus:
                        "fresh",

                    cached:
                        false,

                    cachedAt:
                        new Date(
                            cacheEntry.cachedAt
                        ).toISOString(),

                    staleAgeSeconds:
                        0
                };

            } catch (error) {

                // ------------------------------------------------
                // 4. UPSTREAM FAILED.
                //
                // Try stale data only after the upstream request
                // has exhausted its retries.
                // ------------------------------------------------

                const stale =
                    getPlayerCacheEntry(
                        cacheKey
                    );

                if (
                    isStaleEligible(stale) &&
                    error?.status !== 404
                ) {

                    const staleAgeSeconds =
                        Math.floor(
                            (
                                Date.now() -
                                stale.cachedAt
                            ) / 1000
                        );

                    console.warn(
                        `[COURTSIDE] Serving stale player ` +
                        `${personId} cache ` +
                        `(${staleAgeSeconds}s old)`
                    );

                    return {

                        ...stale.value,

                        dataStatus:
                            "stale",

                        cached:
                            true,

                        cachedAt:
                            new Date(
                                stale.cachedAt
                            ).toISOString(),

                        staleAgeSeconds
                    };
                }

                throw error;

            } finally {

                playerDetailInflight.delete(
                    cacheKey
                );
            }

        })();

    playerDetailInflight.set(
        cacheKey,
        requestPromise
    );

    return await requestPromise;
}

// ============================================================
// HEALTH
// ============================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            ok: true,

            service:
                "COURTSIDE NBA API",

            season:
                currentSeason(),

            time:
                new Date().toISOString()
        });

    }
);

// ============================================================
// SCOREBOARD
// ============================================================

app.get(
    "/api/nba/scoreboard",
    async (req, res) => {

        try {

            const date =
                dateString(
                    req.query.date
                );

            const data =
                await nbaFetch(
                    "scoreboardv3",
                    {
                        GameDate: date,
                        LeagueID: "00"
                    }
                );

            res.json({

                ok: true,

                date,

                scoreboard:
                    data?.scoreboard ??
                    null
            });

        } catch (error) {

            console.error(
                "Scoreboard error:",
                error
            );

            res.status(502).json({

                ok: false,

                error:
                    error.message
            });
        }
    }
);

// ============================================================
// STANDINGS
// ============================================================

app.get(
    "/api/nba/standings",
    async (req, res) => {

        try {

            const season =
                req.query.season ||
                currentSeason();

            const data =
                await nbaFetch(
                    "leaguestandingsv3",
                    {
                        LeagueID: "00",
                        Season: season,
                        SeasonType:
                            "Regular Season",
                        Section: "overall"
                    }
                );

            res.json({

                ok: true,

                season,

                standings:
                    resultSet(
                        data,
                        "Standings"
                    )
            });

        } catch (error) {

            console.error(
                "Standings error:",
                error
            );

            res.status(502).json({

                ok: false,

                error:
                    error.message
            });
        }
    }
);

// ============================================================
// LEADERS
// ============================================================

app.get(
    "/api/nba/leaders",
    async (req, res) => {

        try {

            const season =
                req.query.season ||
                currentSeason();

            const data =
                await nbaFetch(
                    "leagueleaders",
                    {
                        LeagueID: "00",
                        PerMode: "PerGame",
                        Scope: "S",
                        Season: season,
                        SeasonType:
                            "Regular Season",
                        StatCategory: "PTS"
                    }
                );

            res.json({

                ok: true,

                season,

                leaders:
                    firstResultSet(data)
            });

        } catch (error) {

            console.error(
                "Leaders error:",
                error
            );

            res.status(502).json({

                ok: false,

                error:
                    error.message
            });
        }
    }
);

// ============================================================
// PLAYERS DIRECTORY
// ============================================================

app.get(
    "/api/nba/players",
    async (req, res) => {

        try {

            const season =
                req.query.season ||
                currentSeason();

            const data =
                await nbaFetch(
                    "commonallplayers",
                    {
                        LeagueID: "00",
                        Season: season,
                        IsOnlyCurrentSeason: "1"
                    }
                );

            res.json({

                ok: true,

                season,

                players:
                    resultSet(
                        data,
                        "CommonAllPlayers"
                    )
            });

        } catch (error) {

            console.error(
                "Players error:",
                error
            );

            res.status(502).json({

                ok: false,

                error:
                    error.message
            });
        }
    }
);

// ============================================================
// PLAYER DETAIL
// ============================================================
// GET /api/nba/players/:personId
//
// Examples:
// /api/nba/players/1630162
// /api/nba/players/203932
//
// Uses:
// - PERSON_ID validation
// - server-side cache
// - request coalescing
// - 8-second timeout
// - two retries
// - exponential backoff + jitter
// - stale-data fallback
// ============================================================

app.get(
    "/api/nba/players/:personId",
    async (req, res) => {

        const personId =
            String(
                req.params.personId ?? ""
            ).trim();

        // ----------------------------------------------------
        // Validate PERSON_ID
        // ----------------------------------------------------

        if (!/^\d+$/.test(personId)) {

            return res.status(400).json({

                ok: false,

                error:
                    "Invalid PERSON_ID."
            });
        }

        const season =
            currentSeason();

        try {

            const data =
                await getPlayerDetail(
                    personId,
                    season
                );

            // ------------------------------------------------
            // Development API intentionally keeps browser
            // caching disabled.
            //
            // The server-side cache above is independent.
            // ------------------------------------------------

            res.set(
                "Cache-Control",
                "no-store"
            );

            res.set(
                "Pragma",
                "no-cache"
            );

            res.set(
                "X-Courtside-Data",
                data.dataStatus
            );

            return res.status(200).json(
                data
            );

        } catch (error) {

            console.error(
                `[COURTSIDE] Player detail failed: ${personId}`,
                error
            );

            // ------------------------------------------------
            // Genuine player-not-found
            // ------------------------------------------------

            if (
                Number(error?.status) === 404
            ) {

                return res.status(404).json({

                    ok: false,

                    personId,

                    season,

                    error:
                        "Player not found."
                });
            }

            // ------------------------------------------------
            // Upstream failure after timeout/retries and with
            // no usable stale cache.
            // ------------------------------------------------

            return res.status(502).json({

                ok: false,

                personId,

                season,

                error:
                    "NBA player data is temporarily unavailable."
            });
        }
    }
);

// ============================================================
// SERVER START
// ============================================================



/* ============================================================
   M7 ANALYTICS — BEGIN
   Advanced Player & Team Analytics
   ============================================================ */

/* ------------------------------------------------------------
   M7 ANALYTICS CONFIGURATION
   ------------------------------------------------------------ */

const ANALYTICS_RESULT_SETS = {
    players: "LeagueDashPlayerStats",
    teams: "LeagueDashTeamStats"
};

const ANALYTICS_FIXTURE_DIR =
    path.join(
        process.cwd(),
        "m7-fixtures"
    );

const analyticsFixtureCache =
    new Map();

/* ------------------------------------------------------------
   VALIDATION / NORMALIZATION
   ------------------------------------------------------------ */

function normalizeAnalyticsSeason(value) {

    const season =
        String(
            value ||
            currentSeason()
        ).trim();

    if (!/^\d{4}-\d{2}$/.test(season)) {
        throw new Error(
            `Invalid NBA season: ${season}`
        );
    }

    return season;
}

function normalizeAnalyticsSource(value) {

    const source =
        String(
            value ||
            "live"
        ).trim().toLowerCase();

    if (
        source !== "live" &&
        source !== "fixture"
    ) {
        throw new Error(
            `Invalid analytics source: ${source}. Use live or fixture.`
        );
    }

    return source;
}

/* ------------------------------------------------------------
   FIXTURE LOADER
   ------------------------------------------------------------ */

async function loadAnalyticsFixture(
    kind,
    season
) {

    const filename =
        kind === "players"
            ? `leaguedashplayerstats-${season}.json`
            : `leaguedashteamstats-${season}.json`;

    const cacheKey =
        `${kind}:${season}`;

    if (
        analyticsFixtureCache.has(
            cacheKey
        )
    ) {

        return analyticsFixtureCache.get(
            cacheKey
        );
    }

    const fixturePath =
        path.join(
            ANALYTICS_FIXTURE_DIR,
            filename
        );

    if (
        !fs.existsSync(
            fixturePath
        )
    ) {

        throw new Error(
            `Analytics fixture not found for season ${season}: ${fixturePath}`
        );
    }

    const raw =
        fs.readFileSync(
            fixturePath,
            "utf8"
        );

    let parsed;

    try {

        parsed =
            JSON.parse(
                raw
            );

    } catch (error) {

        throw new Error(
            `Analytics fixture contains invalid JSON: ${fixturePath}`
        );
    }

    analyticsFixtureCache.set(
        cacheKey,
        parsed
    );

    return parsed;
}

/* ------------------------------------------------------------
   COMMON RESULT SET MAPPER
   ------------------------------------------------------------
   IMPORTANT:
   resultSet() already converts:

       resultSets[].headers
       resultSets[].rowSet

   into an array of objects.

   Therefore we must NOT check:

       result.headers
       result.rowSet

   after calling resultSet().
   ------------------------------------------------------------ */

function getAnalyticsRows(
    payload,
    expectedResultSet
) {

    const rows =
        resultSet(
            payload,
            expectedResultSet
        );

    if (
        !Array.isArray(rows)
    ) {

        return [];
    }

    return rows;
}

/* ------------------------------------------------------------
   RESPONSE BUILDER
   ------------------------------------------------------------ */

function buildAnalyticsResponse({
    dataState,
    source,
    season,
    resultSetName,
    rows,
    error
}) {

    const response = {
        ok: true,
        season,
        dataState,
        source,
        resultSet: resultSetName,
        rows:
            Array.isArray(rows)
                ? rows
                : []
    };

    if (error) {

        response.ok = false;
        response.error = error;
    }

    return response;
}

/* ------------------------------------------------------------
   PLAYER ANALYTICS DATA LOADER
   ------------------------------------------------------------ */

async function loadAnalyticsPlayers(
    season,
    source
) {

    const resultSetName =
        ANALYTICS_RESULT_SETS.players;

    /* --------------------------------------------------------
       FIXTURE
       -------------------------------------------------------- */

    if (
        source === "fixture"
    ) {

        const fixture =
            await loadAnalyticsFixture(
                "players",
                season
            );

        const rows =
            getAnalyticsRows(
                fixture,
                resultSetName
            );

        return buildAnalyticsResponse({
            dataState:
                rows.length > 0
                    ? "DATA"
                    : "NO_DATA",
            source: "fixture",
            season,
            resultSetName,
            rows
        });
    }

    /* --------------------------------------------------------
       LIVE NBA STATS
       -------------------------------------------------------- */

    const data =
        await nbaFetchWithRetry(
            "leaguedashplayerstats",
            {
                College: "",
                Conference: "",
                Country: "",
                DateFrom: "",
                DateTo: "",
                Division: "",
                DraftPick: "",
                DraftYear: "",
                GameScope: "",
                GameSegment: "",
                Height: "",
                LastNGames: "0",
                LeagueID: "00",
                Location: "",
                MeasureType: "Base",
                Month: "0",
                OpponentTeamID: "0",
                Outcome: "",
                PORound: "0",
                PaceAdjust: "N",
                PerMode: "Totals",
                Period: "0",
                PlayerExperience: "",
                PlayerPosition: "",
                PlusMinus: "N",
                Rank: "N",
                Season: season,
                SeasonSegment: "",
                SeasonType: "Regular Season",
                ShotClockRange: "",
                StarterBench: "",
                TeamID: "0",
                TwoWay: "",
                VsConference: "",
                VsDivision: "",
                Weight: ""
            }
        );
    const rows =
        getAnalyticsRows(
            data,
            resultSetName
        );

    return buildAnalyticsResponse({
        dataState:
            rows.length > 0
                ? "DATA"
                : "NO_DATA",
        source: "live",
        season,
        resultSetName,
        rows
    });
}

/* ------------------------------------------------------------
   TEAM ANALYTICS DATA LOADER
   ------------------------------------------------------------ */

async function loadAnalyticsTeams(
    season,
    source
) {

    const resultSetName =
        ANALYTICS_RESULT_SETS.teams;

    /* --------------------------------------------------------
       FIXTURE
       -------------------------------------------------------- */

    if (
        source === "fixture"
    ) {

        const fixture =
            await loadAnalyticsFixture(
                "teams",
                season
            );

        const rows =
            getAnalyticsRows(
                fixture,
                resultSetName
            );

        return buildAnalyticsResponse({
            dataState:
                rows.length > 0
                    ? "DATA"
                    : "NO_DATA",
            source: "fixture",
            season,
            resultSetName,
            rows
        });
    }

    /* --------------------------------------------------------
       LIVE NBA STATS
       -------------------------------------------------------- */

    const data =
        await nbaFetchWithRetry(
            "leaguedashteamstats",
            {
                Conference: "",
                Division: "",
                GameScope: "",
                GameSegment: "",
                LastNGames: "0",
                LeagueID: "00",
                Location: "",
                MeasureType: "Base",
                Month: "0",
                OpponentTeamID: "0",
                Outcome: "",
                PaceAdjust: "N",
                PerMode: "Totals",
                Period: "0",
                PlayerExperience: "",
                PlayerPosition: "",
                PlusMinus: "N",
                Rank: "N",
                Season: season,
                SeasonSegment: "",
                SeasonType: "Regular Season",
                ShotClockRange: "",
                StarterBench: "",
                TeamID: "0",
                VsConference: "",
                VsDivision: ""
            }
        );

    const rows =
        getAnalyticsRows(
            data,
            resultSetName
        );

    return buildAnalyticsResponse({
        dataState:
            rows.length > 0
                ? "DATA"
                : "NO_DATA",
        source: "live",
        season,
        resultSetName,
        rows
    });
}

/* ------------------------------------------------------------
   PLAYER ANALYTICS ROUTE
   GET /api/nba/analytics/players
   ------------------------------------------------------------ */

app.get(
    "/api/nba/analytics/players",
    async (req, res) => {

        let season;
        let source;

        try {

            season =
                normalizeAnalyticsSeason(
                    req.query.season
                );

            source =
                normalizeAnalyticsSource(
                    req.query.source
                );

            const response =
                await loadAnalyticsPlayers(
                    season,
                    source
                );

            return res.json(
                response
            );

        }
        catch (error) {

            console.error(
                "[M7] Player analytics request failed:",
                error.message
            );

            const isClientError =
                String(error?.message || "")
                    .startsWith("Invalid analytics source:");

            return res.status(
                isClientError
                    ? 400
                    : 502
            ).json(
                buildAnalyticsResponse({
                    dataState: "API_ERROR",
                    source:
                        source || "live",
                    season:
                        season ||
                        String(
                            req.query.season ||
                            currentSeason()
                        ).trim(),
                    resultSetName:
                        ANALYTICS_RESULT_SETS.players,
                    rows: [],
                    error:
                        error.message ||
                        "Player analytics request failed."
                })
            );
        }
    }
);

/* ------------------------------------------------------------
   TEAM ANALYTICS ROUTE
   GET /api/nba/analytics/teams
   ------------------------------------------------------------ */

app.get(
    "/api/nba/analytics/teams",
    async (req, res) => {

        let season;
        let source;

        try {

            season =
                normalizeAnalyticsSeason(
                    req.query.season
                );

            source =
                normalizeAnalyticsSource(
                    req.query.source
                );

            const response =
                await loadAnalyticsTeams(
                    season,
                    source
                );

            return res.json(
                response
            );

        }
        catch (error) {

            console.error(
                "[M7] Team analytics request failed:",
                error.message
            );

            const isClientError =
                String(error?.message || "")
                    .startsWith("Invalid analytics source:");

            return res.status(
                isClientError
                    ? 400
                    : 502
            ).json(
                buildAnalyticsResponse({
                    dataState: "API_ERROR",
                    source:
                        source || "live",
                    season:
                        season ||
                        String(
                            req.query.season ||
                            currentSeason()
                        ).trim(),
                    resultSetName:
                        ANALYTICS_RESULT_SETS.teams,
                    rows: [],
                    error:
                        error.message ||
                        "Team analytics request failed."
                })
            );
        }
    }
);

/* ============================================================
   M7 ANALYTICS — END
   ============================================================ */
// M7 ANALYTICS — END
// ============================================================

// ============================================================
// PRODUCTION ANGULAR HOSTING
// ============================================================

if (!fs.existsSync(BROWSER_DIST)) {
    console.error("");
    console.error("============================================================");
    console.error(" COURTSIDE FRONTEND BUILD NOT FOUND");
    console.error("============================================================");
    console.error("");
    console.error(` Expected Angular build at: ${BROWSER_DIST}`);
    console.error("");
    console.error(" Run:");
    console.error("   npm run build");
    console.error("");
    process.exit(1);
}

console.log(
    `[COURTSIDE] Serving Angular from ${BROWSER_DIST}`
);

// Serve Angular static assets.
app.use(
    express.static(BROWSER_DIST, {
        index: "index.html"
    })
);

// Angular SPA fallback.
//
// API routes remain API routes.
// Browser routes such as /players/203932 and
// /analytics/players receive Angular's index.html.
app.use((req, res, next) => {

    if (
        req.method !== "GET" &&
        req.method !== "HEAD"
    ) {
        return next();
    }

    if (req.path === "/api" || req.path.startsWith("/api/")) {
        return next();
    }

    return res.sendFile(
        path.join(BROWSER_DIST, "index.html")
    );
});


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "============================================================"
        );

        console.log(
            " COURTSIDE NBA DATA SERVER"
        );

        console.log(
            "============================================================"
        );

        console.log("");

        console.log(
           ` API: http://localhost:${PORT}`
        );
console.log(
    ` Frontend: http://localhost:${PORT}`
);

        console.log(
            ` Season: ${currentSeason()}`
        );

        console.log("");

        console.log(
            " Endpoints:"
        );

        console.log(
            "   /api/health"
        );

        console.log(
            "   /api/nba/scoreboard"
        );

        console.log(
            "   /api/nba/standings"
        );

        console.log(
            "   /api/nba/leaders"
        );

        console.log(
            "   /api/nba/players"
        );

        console.log(
            "   /api/nba/players/:personId"
        );

        console.log("");

        console.log(
            " Player cache:"
        );

        console.log(
            `   Fresh: ${PLAYER_CACHE_FRESH_MS / 1000}s`
        );

        console.log(
            `   Stale fallback: ${PLAYER_CACHE_STALE_MS / 1000}s`
        );

        console.log(
            `   Timeout: ${NBA_REQUEST_TIMEOUT_MS / 1000}s`
        );

        console.log(
            `   Retries: ${NBA_MAX_RETRIES}`
        );

        console.log("");

    }
);

