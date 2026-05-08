from simulation.physics import compute_vpd, compute_status, is_light_on, simulate_tick


def test_compute_vpd_warm_humid():
    vpd = compute_vpd(25.0, 60.0)
    assert 1.2 <= vpd <= 1.35


def test_compute_vpd_cool_dry():
    vpd = compute_vpd(20.0, 40.0)
    assert 1.3 <= vpd <= 1.5


def test_compute_status_healthy():
    metrics = {"temp": 24.0, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    assert compute_status(metrics, targets) == "healthy"


def test_compute_status_warning():
    metrics = {"temp": 26.3, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    assert compute_status(metrics, targets) == "warning"


def test_compute_status_critical():
    metrics = {"temp": 32.0, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    assert compute_status(metrics, targets) == "critical"


def test_is_light_on_daytime():
    assert is_light_on({"onHour": 6, "offHour": 20}, current_hour=12.0) is True


def test_is_light_on_night():
    assert is_light_on({"onHour": 6, "offHour": 20}, current_hour=22.0) is False


def test_simulate_tick_returns_all_metrics():
    current = {"temp": 24.0, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900, "vpd": 1.2}
    config = {"baseTemp": 24.0, "baseHumidity": 65.0, "phDriftRate": 0.01, "ecDecayRate": 0.005}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    result = simulate_tick(current, config, targets, light_on=True)
    for key in ["temp", "humidity", "ph", "ec", "co2", "vpd"]:
        assert key in result
        assert isinstance(result[key], float)


def test_simulate_tick_ph_drifts():
    import random
    random.seed(42)
    current = {"temp": 24.0, "humidity": 65.0, "ph": 5.9, "ec": 1.8, "co2": 900, "vpd": 1.2}
    config = {"baseTemp": 24.0, "baseHumidity": 65.0, "phDriftRate": 0.06, "ecDecayRate": 0.005}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    result = simulate_tick(current, config, targets, light_on=False)
    assert result["ph"] > current["ph"] - 0.05
