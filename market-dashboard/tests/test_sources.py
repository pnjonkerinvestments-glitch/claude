"""Parsers for the raw source formats."""

from dashboard.sources import cboe, cftc, fred


def test_fred_skips_missing_values():
    payload = {"observations": [{"date": "2026-10-16", "value": "4.01"},
                                {"date": "2026-10-17", "value": "."}]}
    assert fred.parse_observations(payload) == {"2026-10-16": 4.01}


def test_cboe_index_csv():
    text = "DATE,OPEN,HIGH,LOW,CLOSE\n10/16/2026,15.1,16.0,14.9,15.5\n10/17/2026,15.5,17.2,15.0,16.9\n"
    assert cboe.parse_index_csv(text) == {"2026-10-16": 15.5, "2026-10-17": 16.9}


def test_cboe_index_csv_two_columns():
    assert cboe.parse_index_csv("DATE,VIX9D\n2026-10-16,12.3\n") == {"2026-10-16": 12.3}


def test_cboe_put_call_json():
    payload = {"ratios": [{"name": "TOTAL PUT/CALL RATIO", "value": "0.91"},
                          {"name": "INDEX PUT/CALL RATIO", "value": "1.20"},
                          {"name": "EXCHANGE TRADED PRODUCTS PUT/CALL RATIO", "value": "1.5"},
                          {"name": "EQUITY PUT/CALL RATIO", "value": "0.62"}]}
    assert cboe.parse_put_call(payload) == {"total": 0.91, "index": 1.2, "equity": 0.62}


def test_cftc_net_positions_per_cohort():
    rows = [{"report_date_as_yyyy_mm_dd": "2026-10-13T00:00:00.000", "cftc_contract_market_code": "13874A",
             "open_interest_all": "2000000", "lev_money_positions_long": "100", "lev_money_positions_short": "350",
             "asset_mgr_positions_long": "900", "asset_mgr_positions_short": "200"},
            {"report_date_as_yyyy_mm_dd": "2026-10-13T00:00:00.000", "cftc_contract_market_code": "088691",
             "open_interest_all": "500000", "m_money_positions_long_all": "150000",
             "m_money_positions_short_all": "40000"}]
    parsed = cftc.parse_rows(rows, {"13874A": "am", "088691": "mm"})
    assert parsed["13874A"]["2026-10-13"] == {"net": 700, "oi": 2000000}
    assert parsed["088691"]["2026-10-13"] == {"net": 110000, "oi": 500000}
    assert cftc.parse_rows(rows, {"13874A": "lf"})["13874A"]["2026-10-13"]["net"] == -250


def test_fred_csv_skips_missing_values():
    text = "observation_date,DGS10\n2026-10-12,\n2026-10-13,5.21\n2026-10-14,.\n"
    assert fred.parse_csv(text) == {"2026-10-13": 5.21}
