const express = require('express');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

// Define a route to put events on EventBridge
app.post('/send-event', async (req, res) => {
  const { detailType, source, detail } = req.body;

  const params = {
    Entries: [
      {
        EventBusName: 'default',
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        Time: new Date()
      }
    ]
  };

  try {
    const command = new PutEventsCommand(params);
    const result = await eventBridgeClient.send(command);
    res.status(200).json(result);
    // log event that was sent to EventBridge with the result and the fact it was successful
    console.log(`Event sent successfully with data ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error putting event to EventBridge' });
  }
});

// Define a route to verify event reception
app.get('/verify-event', async (req, res) => {
  const { startTime, endTime } = req.query;
  const logGroupName = '/aws/events/my-detail-type'; // replace with your CloudWatch log group name

  const params = {
    logGroupName,
    startTime: startTime ? new Date(startTime).getTime() : Date.now() - 3600000, // Default to 1 hour ago
    endTime: endTime ? new Date(endTime).getTime() : Date.now(),
    filterPattern: '{ $.source = "myApp" }' // replace with your specific filter pattern if needed
  };

  try {
    const command = new FilterLogEventsCommand(params);
    const data = await cloudWatchLogsClient.send(command);
    res.status(200).json(data);
    console.log(`Event received successfully with data ${JSON.stringify(data)}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving logs from CloudWatch' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
