import asyncio
import logging
from typing import Dict

from simulation.engine import SimulationEngine
from firebase_client import get_sync_db

logger = logging.getLogger(__name__)


class SimulationManager:
    def __init__(self, db):
        self.db = db          # async client — passed to engines
        self._sync_db = None  # sync client — used only for on_snapshot
        self._engines: Dict[str, SimulationEngine] = {}
        self._watch = None

    async def start(self) -> None:
        self._loop = asyncio.get_event_loop()
        self._sync_db = get_sync_db()
        rooms = self.db.collection("rooms").stream()
        async for room_doc in rooms:
            self._spawn(room_doc.id)
        logger.info("SimulationManager: %d engines started", len(self._engines))
        # on_snapshot uses sync gRPC stream; run in thread to avoid blocking event loop
        self._watch = await asyncio.to_thread(
            self._sync_db.collection("rooms").on_snapshot, self._on_snapshot
        )

    def stop(self) -> None:
        if self._watch:
            self._watch.unsubscribe()
        for engine in self._engines.values():
            engine.stop()
        self._engines.clear()

    def _spawn(self, room_id: str) -> None:
        if room_id not in self._engines:
            engine = SimulationEngine(room_id=room_id, db=self.db)
            engine.start(loop=getattr(self, "_loop", None))
            self._engines[room_id] = engine

    def _on_snapshot(self, snapshots, changes, read_time) -> None:
        for change in changes:
            room_id = change.document.id
            if change.type.name == "ADDED":
                self._spawn(room_id)
            elif change.type.name == "REMOVED":
                if room_id in self._engines:
                    self._engines[room_id].stop()
                    del self._engines[room_id]

    @property
    def active_count(self) -> int:
        return len(self._engines)
