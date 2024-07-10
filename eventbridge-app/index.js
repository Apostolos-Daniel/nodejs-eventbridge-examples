const express = require("express");
const {
  EventBridgeClient,
  PutEventsCommand,
} = require("@aws-sdk/client-eventbridge");
const {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({ region: "us-east-1" });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: "us-east-1" });

// Define a route to put events on EventBridge
app.post("/send-event", async (req, res) => {
  const { detailType, source, detail } = req.body;

  const params = {
    Entries: [
      {
        EventBusName: "default",
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        Time: new Date(),
      },
    ],
  };

  try {
    const command = new PutEventsCommand(params);
    const result = await eventBridgeClient.send(command);

    if (result.FailedEntryCount > 0) {
      const errorInfo = result.Entries[0];
      console.error(
        `Error sending event: ${errorInfo.ErrorCode} - ${errorInfo.ErrorMessage}`
      );
      res
        .status(400)
        .json({ error: `Failed to send event: ${errorInfo.ErrorMessage}` });
    } else {
      console.log(
        `Event sent successfully with data ${JSON.stringify(result)}`
      );
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error putting event to EventBridge" });
  }
});

// Define a route to verify event reception
app.get("/verify-event", async (req, res) => {
  const { startTime, endTime } = req.query;
  const logGroupName = "/aws/events/my-detail-type"; // replace with your CloudWatch log group name

  console.log(`Checking logs for log group: ${logGroupName}`);

  const params = {
    logGroupName,
    startTime: startTime ? new Date(startTime).getTime() : Date.now() - 3600000, // Default to 1 hour ago
    endTime: endTime ? new Date(endTime).getTime() : Date.now(),
    filterPattern: '{ $.source = "myApp" }', // replace with your specific filter pattern if needed
  };

  try {
    const command = new FilterLogEventsCommand(params);
    const data = await cloudWatchLogsClient.send(command);
    res.status(200).json(data);
    //console.log(`Event received successfully with data ${JSON.stringify(data)}`);

    // Process the logs to extract events and their detail types
    const events = data.events.map((event) => {
      const message = JSON.parse(event.message);
      return {
        detailType: message["detail-type"],
      };
    });
    console.log(`Processed events: ${JSON.stringify(events, null, 2)}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving logs from CloudWatch" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
