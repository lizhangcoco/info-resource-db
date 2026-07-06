#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$APP_DIR/venv"
PID_FILE="$APP_DIR/gunicorn.pid"
LOG_FILE="$APP_DIR/gunicorn.log"
BIND="0.0.0.0:8080"
WORKERS=3

cd "$APP_DIR"

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "Installing dependencies..."
pip install -r requirements.txt -r requirements-prod.txt

echo "Starting server on $BIND..."

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping old process (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

gunicorn wsgi:app \
    --bind "$BIND" \
    --workers $WORKERS \
    --pid "$PID_FILE" \
    --access-logfile "$LOG_FILE" \
    --error-logfile "$LOG_FILE" \
    --daemon

echo "Server started! PID: $(cat $PID_FILE)"
echo "Log file: $LOG_FILE"
