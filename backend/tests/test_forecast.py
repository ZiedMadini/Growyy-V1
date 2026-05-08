from models.forecast_model import linear_forecast


def test_forecast_returns_five_values():
    result = linear_forecast([24.0, 24.2, 24.5, 24.3, 24.8, 24.6, 24.9], days=5)
    assert len(result) == 5


def test_forecast_values_are_floats():
    result = linear_forecast([6.0, 6.0, 5.95, 6.1, 6.0, 5.95, 5.9])
    assert all(isinstance(v, float) for v in result)


def test_forecast_upward_trend():
    result = linear_forecast([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0], days=3)
    assert result[0] > 7.0
    assert result[1] > result[0]


def test_forecast_single_value():
    result = linear_forecast([24.0], days=5)
    assert len(result) == 5
    assert all(v == 24.0 for v in result)
