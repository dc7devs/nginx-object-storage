import aiohttp
import asyncio
from typing import AsyncGenerator

class MediaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.token = None
        self.session = aiohttp.ClientSession()

    # -------------------------
    # LOGIN
    # -------------------------
    async def login(self, username: str, password: str):
        url = f"{self.base_url}/auth/login"
        async with self.session.post(url, json={
            "username": username,
            "password": password
        }) as res:
            if res.status != 200:
                raise Exception(f"Login falhou: {res.status}")
            data = await res.json()
            self.token = data["token"]
            return self.token

    # -------------------------
    # SIGN URL
    # -------------------------
    async def sign(self, path: str) -> str:
        if not self.token:
            raise Exception("Faça login primeiro")

        url = f"{self.base_url}/media/sign"
        async with self.session.post(
            url,
            json={"path": path},
            headers={"Authorization": f"Bearer {self.token}"}
        ) as res:
            if res.status != 200:
                raise Exception(f"Erro ao assinar: {res.status}")
            data = await res.json()
            return data["signed_url"]

    # -------------------------
    # GET BYTES
    # -------------------------
    async def get_bytes(self, path: str) -> bytes:
        signed = await self.sign(path)
        async with self.session.get(signed) as res:
            if res.status != 200:
                raise Exception(f"Erro ao baixar mídia: {res.status}")
            return await res.read()

    # -------------------------
    # STREAM (ideal p/ vídeos)
    # -------------------------
    async def stream(self, path: str) -> AsyncGenerator[bytes, None]:
        signed = await self.sign(path)
        async with self.session.get(signed) as res:
            if res.status != 200:
                raise Exception(f"Erro no stream: {res.status}")
            async for chunk in res.content.iter_chunked(4096):
                yield chunk

    # -------------------------
    # SALVAR ARQUIVO
    # -------------------------
    async def save(self, path: str, dest: str):
        data = await self.get_bytes(path)
        with open(dest, "wb") as f:
            f.write(data)
        return dest

    async def close(self):
        await self.session.close()
