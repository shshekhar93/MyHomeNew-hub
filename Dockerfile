FROM node:lts-alpine
WORKDIR /app

# Start with package[-lock].json
COPY package*.json ./

# Install dependencies
RUN npm pkg set scripts.prepare="echo prepare ignored"
RUN npm ci

# Copy everything else
COPY . .

RUN npm run build
RUN npm prune --omit-=dev

# Declare external parameters
VOLUME /app/config
EXPOSE 8020

# Start the app
CMD [ "npm", "start" ]