# Deployment Guide

## Prerequisites

- A Linux server (Ubuntu/Debian recommended).
- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

## 1. Transfer Files

Transfer the project files to your server. You can use `git` or `scp`.

```bash
# Example using scp (run from your local machine)
scp -r TripFlow user@your-server-ip:~/
```

## 2. Configuration

### Environment Variables

1.  Navigate to the project directory on your server:
    ```bash
    cd TripFlow
    ```
2.  Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
3.  Edit the `.env` file:
    ```bash
    nano .env
    ```
    -   `JWT_SECRET`: Set this to a long, random string (e.g., generated with `openssl rand -base64 32`).
    -   `CLIENT_URL`: Set this to your domain (e.g., `https://example.com`) or `https://localhost` if testing.
    -   `NTFY_TOPIC`: (Optional) Set a topic name for push notifications via [ntfy.sh](https://ntfy.sh).

### SSL Certificates

The application is configured to run over HTTPS.

**Option A: Self-Signed Certificates (For Testing/Internal Use)**
The project comes with pre-generated self-signed certificates in `client/certs`. You can use these as-is, but your browser will show a security warning.

**Option B: Production Certificates (Let's Encrypt)**
1.  Obtain certificates for your domain (e.g., using Certbot).
2.  Replace the files in `client/certs/` with your real certificates:
    -   `nginx-selfsigned.crt` -> Your full chain certificate.
    -   `nginx-selfsigned.key` -> Your private key.
    *Note: Ensure the filenames match or update `client/nginx.conf` to point to your new files.*

## 3. Run the Application

Build and start the containers:

```bash
docker compose up -d --build
```

Check the status:

```bash
docker compose ps
```

## 4. Create Admin User

Since the database is fresh, you need to create the first user via the command line.

1.  Run the helper script:
    ```bash
    ./add_user.sh
    ```
    *If you get a permission error, run `chmod +x add_user.sh` first.*

2.  Select **Option 2 (Add User)**.
3.  Enter a username and password.
4.  Exit the script.

## 5. Access the Application

Open your browser and navigate to `https://your-server-ip` or `https://your-domain.com`.

## Troubleshooting

-   **Logs**: View logs with `docker compose logs -f`.
-   **Permissions**: Ensure the `server/uploads` and `server/data` directories are writable by the container user if you encounter issues (Docker usually handles this).
