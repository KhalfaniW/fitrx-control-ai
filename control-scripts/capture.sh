#!/bin/bash
notify-send "Capturing"

response=$(curl -s -X POST \
                -H "Content-Type: application/json" \
                http://localhost:3500/capture)

# Extract the explanation from the response
explanation=$(echo $response | jq -r '.explanation')

echo $response > /tmp/control-capture.json

# Send a notification with the explanation
notify-send "Capture Response" "$response" -u normal -t 10000
