import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from firebase_client import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    userId: str
    message: str
    sessionId: str | None = None


# ── Expert knowledge base ──────────────────────────────────────────────────────

_KB: list[tuple[list[str], str]] = [
    (
        ["ph", "acid", "alkaline", "pH down", "pH up"],
        "For hydroponics, maintain pH between **5.5–6.5**. Vegetative stage prefers 6.0–6.5; flowering 5.8–6.2. "
        "To lower pH, add pH Down in 0.5 ml/10L increments and recheck after 30 minutes. "
        "Swings above 7.0 lock out iron and manganese — the most common cause of yellowing despite correct EC."
    ),
    (
        ["ec", "conductivity", "nutrient", "ppm", "salt", "tds"],
        "EC targets by stage — Seedling: 0.8–1.2 mS/cm · Vegetative: 1.2–2.0 · Flowering: 1.8–2.5 · Flush: <0.4. "
        "If EC climbs between feedings, roots are drinking more water than nutrients — top up with plain water. "
        "If EC drops, add nutrients. Always adjust pH *after* mixing nutrients."
    ),
    (
        ["temperature", "temp", "heat", "cold", "hot"],
        "Ideal canopy temperature is **22–26 °C** during lights-on, 18–22 °C lights-off. "
        "Root zone should stay 18–22 °C — warmer water holds less oxygen and invites pythium. "
        "Every 1 °C above 28 °C roughly halves dissolved oxygen in your reservoir."
    ),
    (
        ["humidity", "rh", "moisture", "damp", "condensation"],
        "Target humidity by stage — Seedling: 65–80% · Vegetative: 55–70% · Early flower: 45–55% · Late flower: 35–45%. "
        "High humidity in late flower is the main driver of botrytis (bud rot). "
        "Use VPD as your real target: 0.8–1.2 kPa veg, 1.2–1.6 kPa flower gives optimal transpiration."
    ),
    (
        ["vpd", "vapor pressure", "transpiration"],
        "VPD (Vapour Pressure Deficit) is the best single metric for plant stress. "
        "Target **0.8–1.0 kPa** for seedlings/clones, **1.0–1.3 kPa** vegetative, **1.3–1.6 kPa** flowering. "
        "Low VPD = slow transpiration and nutrient uptake. High VPD = plants close stomata and stall growth. "
        "You can raise VPD by increasing temp or lowering humidity."
    ),
    (
        ["co2", "carbon dioxide", "co₂"],
        "Ambient CO₂ is ~420 ppm. Supplementing to **1000–1500 ppm** can increase yields 20–30% — "
        "but only if light, nutrients, and temp are already optimised. "
        "Above 1500 ppm gives diminishing returns and above 2000 ppm is harmful. "
        "CO₂ enrichment is only effective with lights on; seal the room and boost temp slightly to 26–28 °C."
    ),
    (
        ["light", "led", "lux", "ppfd", "dli", "photoperiod", "spectrum"],
        "For most crops, target **400–600 µmol/m²/s PPFD** in veg, **600–900** in flower. "
        "Seedlings: keep lights 60–80 cm away to avoid bleaching. "
        "18/6 photoperiod for veg, 12/12 to trigger flowering in photoperiod strains. "
        "DLI (Daily Light Integral) of 20–40 mol/m²/day is the sweet spot for most leafy crops and cannabis."
    ),
    (
        ["nitrogen", "yellowing", "yellow", "pale", "deficiency", "n deficiency"],
        "Yellowing starting from **lower/older leaves** = classic nitrogen deficiency. "
        "Check EC first — if it's low, top up nutrients. If EC is correct, check pH (6.0–6.5 for N uptake). "
        "Yellowing from **new growth** indicates iron or calcium lockout — usually a pH problem."
    ),
    (
        ["calcium", "cal", "calmag", "brown spot", "tip burn", "magnesium"],
        "Brown leaf edges and tip burn = calcium deficiency. Interveinal yellowing on new growth = magnesium. "
        "Both are common in RO/soft water — add CalMag at 1–2 ml/L. "
        "Calcium competes with magnesium and potassium at the root — avoid overdosing any single element. "
        "Ensure pH is above 6.0 for proper Ca/Mg uptake."
    ),
    (
        ["root", "roots", "brown root", "slime", "root rot", "pythium"],
        "Healthy roots are white and slightly fuzzy. Brown slimy roots = pythium (root rot). "
        "Causes: reservoir temps above 22 °C, light leaks, low DO (dissolved oxygen). "
        "Treatment: hydrogen peroxide (3 ml of 3% per litre), or beneficial bacteria like Hydroguard. "
        "Drop reservoir temp to 18 °C and increase aeration immediately."
    ),
    (
        ["pump", "oxygen", "aeration", "bubbler", "airstone", "do", "dissolved oxygen"],
        "Dissolved oxygen should be above **6 mg/L** — below 5 mg/L stresses roots and invites pathogens. "
        "Run air pumps 24/7 in reservoirs. In DWC, aim for vigorous bubbling at the root zone. "
        "Cold water holds more oxygen — keep your reservoir below 22 °C."
    ),
    (
        ["dosing", "dose", "recipe", "mixing", "nutrient solution", "feed"],
        "Always add nutrients to water, never the reverse. Mix A and B parts separately before combining. "
        "Order: water → CalMag → Part A → mix → Part B → mix → pH adjust → check EC. "
        "Never mix A and B concentrates directly — they'll precipitate. "
        "Change reservoir fully every 7–14 days to prevent salt buildup and pathogen growth."
    ),
    (
        ["harvest", "flush", "flush week", "trichome", "ripe", "ready"],
        "Start flushing 1–2 weeks before harvest: feed plain pH'd water (5.8–6.2) only. "
        "This clears residual salts and improves final taste. EC should drop below 0.4 by harvest day. "
        "Trichome check: clear = early · milky white = peak THC · amber = THC degrading to CBN (couch-lock). "
        "Harvest when 70–90% milky with 10–20% amber for most strains."
    ),
    (
        ["clone", "cutting", "propagation", "clone gel", "rooting"],
        "Take cuttings from vigorous vegetative growth — 10–15 cm, cut at 45°, remove lower leaves. "
        "Dip in rooting gel, place in rockwool/rapid rooter at 70–80% humidity, 22–24 °C. "
        "Keep under low light (CFL or LED at 50%) — cuttings root better without high light stress. "
        "Roots visible in 7–14 days. Don't feed nutrients until roots emerge."
    ),
    (
        ["germination", "seed", "germinate", "sprout"],
        "Germinate seeds between damp paper towels at 24–26 °C in a dark, warm spot. "
        "Tap roots emerge in 24–72 hours. Transfer to growing medium when tap root is 1–2 cm. "
        "First week: no nutrients, just plain water pH'd to 6.0. Cotyledons feed the seedling initially. "
        "Provide gentle airflow from day 1 to build strong stems."
    ),
    (
        ["mold", "mould", "botrytis", "bud rot", "powdery mildew", "pm", "fungus"],
        "Powdery mildew appears as white powder on leaves — caused by high humidity + poor airflow. "
        "Treat with potassium bicarbonate spray or diluted hydrogen peroxide (1:9 ratio). "
        "Botrytis (grey mold) in dense buds needs immediate removal of infected material. "
        "Prevention: keep late-flower humidity below 45%, ensure strong airflow through the canopy."
    ),
    (
        ["spider mite", "mite", "aphid", "pest", "bug", "insect", "thrips", "fungus gnat"],
        "Spider mites: tiny dots on leaves + fine webbing. Treat with neem oil or insecticidal soap, "
        "repeat every 3 days for 2 weeks. Aphids: sticky residue + clusters under leaves — neem oil works. "
        "Fungus gnats: larvae damage roots — let top layer dry between waterings, use sticky traps, "
        "add beneficial nematodes to medium. Always treat early; infestations double every few days."
    ),
    (
        ["system", "dwc", "nft", "ebb", "flow", "kratky", "flood", "drain", "hydroponic system"],
        "DWC (Deep Water Culture): roots suspended in oxygenated nutrient solution — fast growth, simple setup. "
        "NFT: thin film of nutrients flows over roots — very efficient but unforgiving if pump fails. "
        "Ebb & Flow: periodic flooding of grow tray — good for multiple plants. "
        "Kratky: passive DWC with no pump — great for leafy greens, not ideal for large plants."
    ),
    (
        ["grow medium", "rockwool", "coco", "perlite", "clay pebbles", "hydroton", "substrate"],
        "Rockwool: inert, great water retention, pH needs pre-soaking at 5.5. "
        "Coco coir: excellent aeration and reuse, naturally low pH, needs CalMag supplementation. "
        "Clay pebbles (hydroton): excellent drainage and reuse, rinse thoroughly before use. "
        "Perlite: cheap, great aeration, often mixed with coco at 30–40% for ideal water/air balance."
    ),
    (
        ["hello", "hi", "hey", "help", "what can you do", "growy", "start"],
        "Hi! I'm **Growy**, your hydroponics assistant. I can help you with:\n"
        "- 💧 **Nutrient management** — pH, EC, deficiencies\n"
        "- 🌡️ **Environment** — temperature, humidity, VPD, CO₂\n"
        "- 🌱 **Plant health** — pests, diseases, root issues\n"
        "- 📅 **Grow stages** — germination, veg, flower, harvest\n\n"
        "Just ask me anything about your grow!"
    ),
]

_FALLBACK = (
    "Good question. For best results, maintain these core parameters: "
    "pH 5.8–6.5, EC matched to your growth stage, temperature 22–26 °C, "
    "humidity 55–65% (lower in flower), and CO₂ at 800–1200 ppm if supplementing. "
    "If you're seeing a specific issue, describe the symptoms and I'll give you a targeted fix."
)


def _scripted_reply(message: str, room_problems: list[str]) -> str:
    lower = message.lower()
    for keywords, response in _KB:
        if any(kw in lower for kw in keywords):
            if room_problems:
                note = " — Note: your current alerts show " + "; ".join(room_problems[:2]) + "."
                return response + note
            return response
    if room_problems:
        issues = ", ".join(room_problems[:3])
        return (
            f"Based on your live readings, I'm seeing: **{issues}**. "
            "Address these first — most secondary symptoms resolve once core parameters are dialled in. "
            "Ask me about any of these specifically for a step-by-step fix."
        )
    return _FALLBACK


# ── Context fetch (room problems only — no LLM needed) ───────────────────────

async def _get_room_problems(user_id: str) -> list[str]:
    db = get_db()
    problems: list[str] = []
    unit_map = {"temp": "°C", "humidity": "%", "ph": "", "ec": " mS", "co2": " ppm"}
    try:
        async for doc in db.collection("rooms").where("userId", "==", user_id).stream():
            r = doc.to_dict()
            m = r.get("currentMetrics", {})
            t = r.get("targets", {})
            name = r.get("name", "room")
            for key in ["temp", "humidity", "ph", "ec", "co2"]:
                val = m.get(key)
                rng = t.get(key)
                if val is None or not rng:
                    continue
                lo, hi = float(rng[0]), float(rng[1])
                if not (lo <= float(val) <= hi):
                    problems.append(f"{key.upper()} in {name} is {val}{unit_map[key]} (target {lo}–{hi})")
    except Exception:
        pass
    return problems


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("")
async def chat(req: ChatRequest):
    db = get_db()
    now = datetime.now(timezone.utc)

    history = []
    session_ref = None
    if req.sessionId:
        session_ref = db.collection("chatSessions").document(req.sessionId)
        snap = await session_ref.get()
        if snap.exists:
            history = snap.to_dict().get("messages", [])

    room_problems = await _get_room_problems(req.userId)
    ai_text = _scripted_reply(req.message, room_problems)

    user_msg = {
        "id": f"u{int(now.timestamp() * 1000)}",
        "role": "user",
        "text": req.message,
        "timestamp": now,
    }
    ai_msg = {
        "id": f"a{int(now.timestamp() * 1000) + 1}",
        "role": "ai",
        "text": ai_text,
        "timestamp": now,
    }
    new_messages = (history + [user_msg, ai_msg])[-50:]

    if session_ref is None:
        session_ref = db.collection("chatSessions").document()

    await session_ref.set(
        {"userId": req.userId, "messages": new_messages, "updatedAt": now},
        merge=True,
    )

    return {"sessionId": session_ref.id, "reply": ai_text}
