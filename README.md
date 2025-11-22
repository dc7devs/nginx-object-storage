### Clone & start de servidor

```bash
git clone git@github.com:dc7devs/detritus-nfs-server.git
cd detritus-nfs-server

docker compose up -d
```

### Variaveis ambiente

|Variável|Descrição|Default|
|---|---|---|
|`MEDIA_ROOT`|Caminho raiz das mídias|`/mnt/nfs`|
|`JWT_SECRET`|Secret usado no JWT|`dev-secret`|
|`JWT_EXPIRES_IN`|Tempo de expiração do token|`1h`|
|`AUTH_USER`|Usuário fixo para login|`kgcmina@admin`|
|`AUTH_PASS`|Senha fixa para login|`kgcmina@admin`|
|`CORS_ORIGIN`|Origem permitida no CORS|`*`|
|`PORT`|Porta do servidor|`3000`|

---
### **Login**

```bash
curl -X POST http://<$HOST>:$PORT/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kgcmina@admin","password":"kgcmina@admin"}'
```

### **Listar Arquivos**

```bash
curl "http://<$HOST>:$PORT/files?dir=cam1" \
  -H "Authorization: Bearer <TOKEN>"
```

### **Baixar Arquivo**

```bash
curl "http://<$HOST>:$PORT/media/images/frame_0001.jpg" \
  -H "Authorization: Bearer <TOKEN>" \
  -o frame_0001.jpg
```