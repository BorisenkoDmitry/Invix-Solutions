from aiogram.fsm.state import State
from aiogram.fsm.storage.base import BaseStorage, StorageKey


class NoStateStorage(BaseStorage):
    async def set_state(self, key: StorageKey, state: str | State | None = None):
        raise RuntimeError("FSM is disabled")

    async def get_state(self, key: StorageKey):
        return None

    async def set_data(self, key: StorageKey, data: dict):
        raise RuntimeError("FSM is disabled")

    async def get_data(self, key: StorageKey):
        return {}

    async def close(self):
        pass
