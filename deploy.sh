#!/bin/bash

# Build the React application
echo "Building React application..."
npm run build

# Create necessary directories on the server
echo "Creating directories..."
ssh user@your-server "mkdir -p /var/www/html/psygstore.com/{public_html,logs,backup}"

# Backup existing files
echo "Creating backup..."
ssh user@your-server "cd /var/www/html/psygstore.com && tar -czf backup/backup-$(date +%Y%m%d-%H%M%S).tar.gz public_html"

# Deploy frontend files
echo "Deploying frontend files..."
rsync -avz --delete dist/ user@your-server:/var/www/html/psygstore.com/public_html/

# Deploy API files
echo "Deploying API files..."
rsync -avz api/ user@your-server:/var/www/html/psygstore.com/public_html/api/

# Set permissions
echo "Setting permissions..."
ssh user@your-server "chmod -R 755 /var/www/html/psygstore.com/public_html && find /var/www/html/psygstore.com/public_html -type f -exec chmod 644 {} \;"

# Create/update .env file
echo "Updating environment variables..."
ssh user@your-server "cat > /var/www/html/psygstore.com/public_html/api/.env" << EOL
DB_HOST=localhost
DB_NAME=psygstore
DB_USER=your_db_user
DB_PASS=your_db_password
EOL

echo "Deployment completed successfully!"