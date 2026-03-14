# Select the base image with a pinned LTS version and slim variant for smaller size
FROM node:22-slim

# Set production environment
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install production dependencies only with deterministic installs
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Create writable directories for volume mounts and set ownership to node user
RUN mkdir -p results collections environments datafiles featuretests config bruno \
    && chown -R node:node results collections environments datafiles featuretests config bruno

# Declare volumes for mutable data directories
VOLUME ["/usr/src/app/results", \
        "/usr/src/app/collections", \
        "/usr/src/app/environments", \
        "/usr/src/app/datafiles", \
        "/usr/src/app/featuretests", \
        "/usr/src/app/config", \
        "/usr/src/app/bruno"]

# Run as non-root user for security
USER node

# Your app binds to port 8080 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "index.js" ]
