from contextlib import asynccontextmanager

from psycopg_pool import AsyncConnectionPool


@asynccontextmanager
async def claim_update(pool: AsyncConnectionPool, update_id: int):
    async with pool.connection() as connection, connection.transaction():
        cursor = await connection.execute(
            "INSERT INTO telegram_updates(update_id) VALUES (%s) ON CONFLICT DO NOTHING RETURNING update_id",
            (update_id,),
        )
        yield await cursor.fetchone() is not None
