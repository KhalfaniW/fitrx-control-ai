 # todo bundle all these the same
FROM node:latest

WORKDIR /app

# Mount current directory as a volume
VOLUME /app

# Expose the development server port
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev"]