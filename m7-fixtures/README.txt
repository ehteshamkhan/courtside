COURTSIDE M7 ANALYTICS FIXTURES

These files are captured development fixtures from the
M7-01C live-schema discovery audit.

They represent the 2025-26 NBA Stats response captured during
development.

IMPORTANT:

These fixtures are NOT current live NBA data.

The COURTSIDE application must only expose them when the
analytics API is explicitly requested with:

    ?source=fixture

The normal API path attempts the NBA Stats endpoint.

If the live endpoint fails, the application reports:

    API_ERROR

It must never silently substitute fixture data for live data.

Missing numeric values remain null and are rendered as —.

No unverified fields such as TS_PCT, USG_PCT, OFF_RATING,
DEF_RATING, NET_RATING, or PIE are added.