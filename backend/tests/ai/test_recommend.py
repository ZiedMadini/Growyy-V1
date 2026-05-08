from ai.recommend.rules import run_rules
from ai.recommend.model import RecommendationEngine


T = {"ph": [5.8, 6.5], "ec": [1.5, 2.0], "temp": [20.0, 28.0], "humidity": [50.0, 70.0], "co2": [800.0, 1200.0]}


def metrics(**kw):
    return {"ph": 6.0, "ec": 1.8, "temp": 24.0, "humidity": 60.0, "vpd": 1.0, "co2": 1000.0, **kw}


def test_high_ph_triggers_ph_down():
    actions = [a for a in run_rules(metrics(ph=6.9), T) if a["metric"] == "ph"]
    assert len(actions) == 1
    assert "pH Down" in actions[0]["action"]
    assert actions[0]["severity"] in ("warning", "critical")


def test_low_ph_triggers_ph_up():
    actions = run_rules(metrics(ph=5.3), T)
    assert any("pH Up" in a["action"] for a in actions if a["metric"] == "ph")


def test_healthy_no_actions():
    assert len(run_rules(metrics(), T)) == 0


def test_critical_temp():
    actions = run_rules(metrics(temp=35.0), T)
    assert any(a["severity"] == "critical" for a in actions if a["metric"] == "temp")


def test_high_vpd():
    actions = run_rules(metrics(vpd=1.9), T)
    assert any(a["metric"] == "vpd" for a in actions)


def test_engine_recommend_structure():
    eng = RecommendationEngine()
    eng.load()
    result = eng.recommend(
        metrics=metrics(),
        targets=T,
        stage="Vegetative",
        day=14,
        total_days=60,
    )
    assert "immediate" in result
    assert "optimizations" in result
    assert "model_active" in result
    assert "generated_at" in result


def test_engine_out_of_range_generates_action():
    eng = RecommendationEngine()
    eng.load()
    result = eng.recommend(
        metrics=metrics(ph=7.2),
        targets=T,
        stage="Vegetative",
        day=14,
        total_days=60,
    )
    assert len(result["immediate"]) > 0
