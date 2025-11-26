### Clone & start de servidor

```bash
git clone git@github.com:dc7devs/nginx-object-storage.git
cd nginx-object-storage

docker compose up -d
```

### Variaveis ambiente

|Variável|Descrição|Default|
|---|---|---|
|`JWT_SECRET`|Secret usado no JWT|`dev-secret`|
|`AUTH_USER`|Usuário fixo para login|`kgcmina@admin`|
|`AUTH_PASS`|Senha fixa para login|`kgcmina@admin`|
|`MEDIA_BASE_URL`|URL nginx|`http://<$HOST>:8080`|
|`PORT`|Porta do servidor|`3333`|

---
#### **LOGIN**

```bash
curl -X POST http://<$HOST>:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kgcmina@admin","password":"kgcmina@admin"}'
```

#### **SIGN URL**

```bash
curl "http://<$HOST>:3333/media/sign" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "path": "/videos/video1.mp4" }'
```

#### **DOWNLOAD**

```bash
curl "http://<$HOST>:3333/media/images/frame_0001.jpg?token=TOKEN" \
  -o frame_0001.jpg
```

## **CASO DE USO**

### Salvar e assinar imagem gerado por pipeline
```python
from media_sdk import MediaClient
import cv2
import uuid

async def main():
  client = MediaClient("http://172.0.0.1:3333")

  await client.login("kgcmina@admin", "kgcmina@admin")

  frame = ...  # output do modelo
  filename = f"/images/cam1/frame_{uuid.uuid4()}.jpg"
  full_path = f"./storage{filename}"

  cv2.imwrite(full_path, frame)

  # gerar signed_url
  signed = await client.sign(filename)

  print("Signed URL:", signed)
```

### Enviando payload p/ o Kafka
```python
from media_sdk import MediaClient
import kafka

def main:
  client = MediaClient("http://172.0.0.1:3333")

  await client.login("kgcmina@admin", "kgcmina@admin")

  img1 = await client.sign("/images/cam5/obj_001.jpg")
  img2 = await client.sign("/images/cam5/obj_002.jpg")
  video = await client.sign("/videos/cam5/v_001.mp4")

  payload = {
      "id": "205-cam5-abc123",
      "location": {"coordinates": [-74.0060, 40.7128]},
      "imgs": [img1, img2],
      "video": video,
  }

  print("Kafka payload:", payload)

  producer = kafka.KafkaProducer(value_serializer=lambda v: json.dumps(v).encode())
  producer.send("detections", payload)
  producer.flush()
```
