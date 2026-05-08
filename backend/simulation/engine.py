import asyncio
import logging
import random
from concurrent.futures import Future
from datetime import datetime, timedelta, timezone
from typing import Optional

from simulation.physics import simulate_tick, compute_status, is_light_on
from firebase_client import send_push
from config import settings

logger = logging.getLogger(__name__)


class SimulationEngine:
    def __init__(self, room_id: str, db):
        self.room_id = room_id
        self.db = db
        self._future: Optional[Future] = None
        self._running = False

    def start(self, loop: asyncio.AbstractEventLoop | None = None) -> None:
        if self._running:
            return
        self._running = True
        if loop is None:
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
        self._future = asyncio.run_coroutine_threadsafe(self._loop(), loop)
        logger.info("Started simulation for room %s", self.room_id)

    def stop(self) -> None:
        self._running = False
        if self._future and not self._future.done():
            self._future.cancel()

    async def _loop(self) -> None:
        while self._running:
            try:
                await self._tick()
            except Exception as exc:
                logger.exception("Tick error room %s: %s", self.room_id, exc)
            await asyncio.sleep(settings.simulation_interval_seconds)

    async def _tick(self) -> None:
        room_ref = self.db.collection("rooms").document(self.room_id)
        snap = await room_ref.get()
        if not snap.exists:
            self.stop()
            return

        room = snap.to_dict()
        current = room.get("currentMetrics", {})
        config = room.get("simulationConfig", {})
        targets = room.get("targets", {})
        light_schedule = room.get("lightSchedule", {"onHour": 6, "offHour": 20})

        if not current or not targets:
            return

        light_on = is_light_on(light_schedule)
        new_metrics = simulate_tick(current, config, targets, light_on)
        new_status = compute_status(new_metrics, targets)
        now = datetime.now(timezone.utc)

        await room_ref.collection("readings").add({**new_metrics, "timestamp": now})
        await room_ref.update({"currentMetrics": new_metrics, "status": new_status, "updatedAt": now})

        if new_status != "healthy":
            await self._write_alert(room, new_metrics, targets, new_status, now)

        if random.random() < 0.01:
            await self._purge_old_readings(room_ref, now)

    async def _write_alert(self, room, metrics, targets, status, now):
        user_id = room.get("userId")
        room_name = room.get("name", self.room_id)
        title = f"{room_name}: {status}"
        unit_map = {"temp": "°C", "humidity": "%", "ph": "", "ec": " mS", "co2": " ppm"}
        for key in ["temp", "humidity", "ph", "ec", "co2"]:
            if key not in targets or key not in metrics:
                continue
            val = float(metrics[key])
            lo, hi = float(targets[key][0]), float(targets[key][1])
            if val < lo or val > hi:
                title = f"{key.upper()} out of range in {room_name}: {val}{unit_map.get(key, '')}"
                break

        await self.db.collection("notifications").add({
            "userId": user_id,
            "roomId": self.room_id,
            "title": title,
            "severity": status,
            "read": False,
            "timestamp": now,
        })
        room_ref = self.db.collection("rooms").document(self.room_id)
        await room_ref.collection("events").add({"type": "alert", "text": title, "timestamp": now})

        # Send FCM push to all registered device tokens for this user
        if user_id:
            await self._send_push_to_user(user_id, title)

    async def _send_push_to_user(self, user_id: str, title: str) -> None:
        try:
            tokens_ref = (
                self.db.collection("users").document(user_id).collection("fcmTokens")
            )
            async for token_doc in tokens_ref.stream():
                token = token_doc.to_dict().get("token")
                if token:
                    await asyncio.to_thread(send_push, token, "Growy Alert", title)
        except Exception as exc:
            logger.warning("FCM push failed for user %s: %s", user_id, exc)

    async def _purge_old_readings(self, room_ref, now):
        cutoff = now - timedelta(days=30)
        async for doc in room_ref.collection("readings").where("timestamp", "<", cutoff).limit(100).stream():
            await doc.reference.delete()
