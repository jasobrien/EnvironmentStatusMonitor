# Select the base image. In our case, we'll use the official Node.js Docker image.
FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install your dependencies
RUN npm install

# Bundle app source
COPY . .

# Your app binds to port 8080 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "index.js" ]
