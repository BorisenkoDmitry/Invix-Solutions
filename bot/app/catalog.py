import httpx


async def load_products(api_url: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(f"{api_url}/v1/products")
        response.raise_for_status()
        return response.json()
