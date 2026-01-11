
# Stage 1: Client
FROM node:18-alpine as client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
# For dev access via ngrok, we verify host 0.0.0.0 is used
ENV VITE_HOST=0.0.0.0

# Stage 2: Server
FROM node:18-alpine as server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# We will use Docker Compose to run them, but these are the build definitions
