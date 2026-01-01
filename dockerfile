# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build (creates dist/index.cjs and dist/public)
RUN npm run build


# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy runtime needs
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Keep fonts folder available in image (Umbrel will mount persistent volume here)
COPY --from=build /app/fonts ./fonts

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
