#!/bin/bash
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe magb-poc --format="value(connectionName)")
./cloud-sql-proxy.exe $INSTANCE_CONNECTION_NAME --port=5433 &
echo "Cloud SQL Auth Proxy started on port 5433 (PID: $!)"
