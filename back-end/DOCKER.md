# Docker — apenas PostgreSQL (desenvolvimento)

Para subir **só o banco** durante o desenvolvimento local:

```bash
docker compose up -d
```

Para a **stack completa** (Postgres + migrate/seed + Next.js), use o compose da **raiz** do repositório:

```bash
cd ..
docker compose up --build -d
```
