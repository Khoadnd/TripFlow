#!/bin/sh

# Defaults
export HTTP_PORT=${HTTP_PORT:-80}
export SSL_PORT=${SSL_PORT:-443}
export DOMAIN_NAME=${DOMAIN_NAME:-localhost}
export LISTEN_IP=${LISTEN_IP:-0.0.0.0}

# Configure Listen Directives
if [ "$LISTEN_IP" = "0.0.0.0" ]; then
    export LISTEN_HTTP="$HTTP_PORT"
    export LISTEN_SSL="$SSL_PORT ssl"
else
    export LISTEN_HTTP="$LISTEN_IP:$HTTP_PORT"
    export LISTEN_SSL="$LISTEN_IP:$SSL_PORT ssl"
fi

echo "Configuring Nginx:"
echo "  Domain: $DOMAIN_NAME"
echo "  HTTP:   $LISTEN_HTTP"
echo "  SSL:    $LISTEN_SSL"

# Certificate Management
CERT_DIR="/etc/nginx/certs"
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
    echo "No SSL certificate found. Generating self-signed certificate for $DOMAIN_NAME..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN_NAME"
else
    echo "Using existing SSL certificates."
fi

# Generate Nginx Config
envsubst '${LISTEN_HTTP} ${LISTEN_SSL} ${DOMAIN_NAME}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
exec nginx -g "daemon off;"
