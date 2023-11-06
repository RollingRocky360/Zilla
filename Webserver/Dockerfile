FROM nginx

# Copy a configuration file from the current directory
COPY nginx.conf /etc/nginx/nginx.conf

COPY build /usr/share/nginx/html/
COPY build /var/www/html/

EXPOSE 80