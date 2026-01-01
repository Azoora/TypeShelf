## Run TypeShelf with Docker (quick test)

### 1) Build
docker build -t typeshelf:local .

### 2) Run (needs DATABASE_URL)
docker network create typeshelf-net || true

docker run -d --name typeshelf-db --network typeshelf-net \
  -e POSTGRES_DB=typeshelf \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=typeshelf \
  -p 5432:5432 \
  postgres:16-alpine

docker run -d --name typeshelf --network typeshelf-net \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://postgres:typeshelf@typeshelf-db:5432/typeshelf \
  -p 5000:5000 \
  -v $(pwd)/fonts:/app/fonts \
  typeshelf:local
