# Use a Node.js image if you need to process or build files; otherwise, it's not required for static sites.
FROM node:18 AS build

# Create and set the working directory
WORKDIR /app

# Copy application files into the container
COPY . .

# Stage 2: Production stage
# Use Nginx to serve the static content
FROM nginx:alpine

# Copy the static files from the build stage to the Nginx server
COPY --from=build /app /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
