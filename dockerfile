# --------------------
# Build stage
# --------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeShelf (creates dist/index.cjs)
RUN npm run build


# --------------------
# Runtime stage
# --------------------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy only what is needed at runtime
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/fonts ./fonts

# Drizzle config (TypeScript)
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 5000

# Matches: "start": "node dist/index.cjs"
CMD ["node", "dist/index.cjs"]
