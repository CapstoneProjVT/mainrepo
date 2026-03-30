import socket
import time
import sys

def check_db():
    host = "db"
    port = 5432
    max_retries = 30
    print(f"Waiting for {host}:{port}...", flush=True)
    for i in range(max_retries):
        try:
            with socket.create_connection((host, port), timeout=2):
                print("Database is ready on TCP!", flush=True)
                return 0
        except Exception as e:
            print(f"Attempt {i+1}/{max_retries} failed: {e}", flush=True)
            time.sleep(1)
    print("Giving up after waiting for DB.", flush=True)
    return 1

if __name__ == "__main__":
    sys.exit(check_db())
