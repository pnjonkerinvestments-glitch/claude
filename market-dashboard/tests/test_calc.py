import math

import pytest

from dashboard import calc
from dashboard.calc import GREEN, NODATA, ORANGE, RED


# --- regime score ------------------------------------------------------------

def test_verdict_risk_on():
    v = calc.regime_verdict([GREEN] * 6 + [ORANGE] * 2 + [RED], 33, -33)
    assert (v.score, v.counted, v.label) == (5, 9, "Risk-on")
    assert v.pct == pytest.approx(500 / 9)


def test_verdict_risk_off():
    v = calc.regime_verdict([RED] * 5 + [GREEN, ORANGE], 33, -33)
    assert v.score == -4 and v.label == "Risk-off"


def test_verdict_neutral_and_thresholds_inclusive():
    assert calc.regime_verdict([GREEN, ORANGE, ORANGE], 34, -34).label == "Neutral"   # +33%
    assert calc.regime_verdict([GREEN, ORANGE, ORANGE], 33, -33).label == "Risk-on"   # 33.3 >= 33
    assert calc.regime_verdict([GREEN, RED], 33, -33).label == "Neutral"              # 0%
    assert calc.regime_verdict([RED, ORANGE, ORANGE], 33, -33).label == "Risk-off"    # -33.3%


def test_verdict_skips_nodata():
    v = calc.regime_verdict([GREEN, GREEN, NODATA, NODATA], 33, -33)
    assert v.counted == 2 and v.pct == 100 and v.label == "Risk-on"
    assert "2 indicator(s) without data" in v.explanation


def test_verdict_without_data():
    assert calc.regime_verdict([NODATA], 33, -33).label == "No data"


def test_verdict_explanation_shows_tally():
    v = calc.regime_verdict([GREEN, GREEN, RED, ORANGE], 33, -33)
    assert "2 green (+1), 1 orange (0), 1 red (−1)" in v.explanation
    assert "score +1 of 4" in v.explanation


# --- indicator colours -------------------------------------------------------

@pytest.mark.parametrize("above,expected", [(3, GREEN), (2, ORANGE), (1, ORANGE), (0, RED)])
def test_trend_color(above, expected):
    assert calc.trend_color(above, 3, 1) == expected


@pytest.mark.parametrize("p50,p200,expected", [
    (70, 65, GREEN), (60, 60, GREEN), (70, 50, ORANGE), (30, 35, RED), (40, 40, RED), (30, 70, ORANGE)])
def test_breadth_color(p50, p200, expected):
    assert calc.breadth_color(p50, p200, 60, 40) == expected


@pytest.mark.parametrize("vix,expected", [(14, GREEN), (18, ORANGE), (25, ORANGE), (25.1, RED)])
def test_color_band(vix, expected):
    assert calc.color_band(vix, 18, 25) == expected


def test_term_structure_color():
    assert calc.term_structure_color(15, 18, 0.95, 1.0) == GREEN      # 0.83 contango
    assert calc.term_structure_color(17.5, 18, 0.95, 1.0) == ORANGE   # 0.97
    assert calc.term_structure_color(22, 20, 0.95, 1.0) == RED        # backwardation


def test_credit_color():
    cfg = {"green_max_level": 4.0, "green_max_change_bp": 0, "red_min_level": 5.0, "red_min_change_bp": 50}
    assert calc.credit_color(3.2, -10, cfg) == GREEN
    assert calc.credit_color(3.2, 20, cfg) == ORANGE
    assert calc.credit_color(3.2, 60, cfg) == RED
    assert calc.credit_color(5.5, -20, cfg) == RED


def test_curve_color():
    assert calc.curve_color(0.8, 0.5, 0.0) == GREEN
    assert calc.curve_color(0.2, 0.5, 0.0) == ORANGE
    assert calc.curve_color(-0.3, 0.5, 0.0) == RED


# --- moving averages and breadth --------------------------------------------

def test_sma_and_rolling_mean():
    assert calc.sma([1, 2, 3, 4], 2) == 3.5
    assert calc.sma([1, 2], 3) is None
    assert calc.rolling_mean([1, 2, 3, 4], 2) == [None, 1.5, 2.5, 3.5]


def test_ma_position():
    closes = list(range(1, 201))  # steadily rising: last close above every average
    assert calc.ma_position(closes, [20, 50, 200]) == {20: True, 50: True, 200: True}
    assert calc.ma_position(closes[::-1], [20, 50]) == {20: False, 50: False}
    assert calc.ma_position(closes[:30], [50]) == {50: None}


def test_breadth_percent_and_exclusions():
    rising = [float(i) for i in range(1, 61)]
    falling = rising[::-1]
    comps = {"A": rising, "B": rising, "C": falling, "D": rising[:10], "E": []}
    pct, n = calc.breadth(comps, 50)
    assert n == 3                       # D and E lack 50 days of history
    assert pct == pytest.approx(200 / 3)


def test_breadth_without_history():
    assert calc.breadth({"A": [1.0, 2.0]}, 50) == (None, 0)


# --- COT index and percentiles ----------------------------------------------

def test_cot_index_bounds():
    assert calc.cot_index([-100, 0, 100, 50]) == 75
    assert calc.cot_index([10, 20, 30]) == 100
    assert calc.cot_index([30, 20, 10]) == 0
    assert calc.cot_index([5, 5, 5]) == 50
    assert calc.cot_index([]) is None


def test_percentile_rank():
    hist = list(range(1, 101))
    assert calc.percentile_rank(hist, 50) == 50
    assert calc.percentile_rank(hist, 100) == 100
    assert calc.percentile_rank(hist, 0) == 0
    assert calc.percentile_rank([], 1) is None


# --- expected move -----------------------------------------------------------

def test_expected_move_formula():
    assert calc.expected_move(5000, 16) == pytest.approx(5000 * 0.16 / math.sqrt(252))
    assert calc.expected_move(5000, 16) == pytest.approx(50.39, abs=0.01)


def test_expected_move_scales_linearly():
    assert calc.expected_move(4000, 20) == pytest.approx(2 * calc.expected_move(4000, 10))


def test_verdict_explanation_uses_minus_signs_only_for_numbers():
    v = calc.regime_verdict([RED, RED, ORANGE], 33, -33)
    assert "score −2 of 3" in v.explanation
    assert "Risk-on at ≥ +33%, risk-off at ≤ −33%" in v.explanation
