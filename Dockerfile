FROM node:lts-alpine
WORKDIR /app

# Start with package[-lock].json
COPY package*.json ./

# Install dependencies
RUN npm pkg set scripts.prepare="echo prepare ignored"
RUN npm ci --omit="dev"

# Copy everything else
COPY . .

EXPOSE 8020

# Start the app
CMD [ "npm", "start" ]