# nodejs-eventbridge-examples

## Prerequisites

This assumes that you have AWS credentials (`aws_access_key_id` and `aws_secret_access_key`) configured in your local environment.

## Send a test event to EventBridge

Start your server:

```bash
node index.js
```

Then send a test event using curl:

```bash
curl -X POST http://localhost:3000/send-event -H "Content-Type: application/json" -d '{
  "detail-type": "myDetailType",
  "source": "myApp",
  "detail": {
    "key1": "value1",
    "key2": "value2"
  }
}'
```

## Verify the event has been received by EventBridge

Run:

```bash
curl -X GET 'http://localhost:3000/verify-event?startTime=2024-07-10T00:00:00Z&endTime=2024-07-10T23:59:59Z'
```
