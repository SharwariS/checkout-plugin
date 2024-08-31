const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Define the reminder schedule
const recoverySchedule = [
  // for testing data
  // { delay: 30 * 1000, message: 'First reminder: Complete your purchase!' }, // 30 seconds
  // { delay: 24 * 60 * 60 * 1000, message: 'Second reminder: Don\'t forget your cart!' }, // 1 minute
  // { delay: 3 * 24 * 60 * 60 * 1000, message: 'Final reminder: Your cart is waiting!' }  // 2 minutes
{ delay: 30 * 60 * 1000, message: 'First reminder: Complete your purchase!' }, // 30 minutes
{ delay: 24 * 60 * 60 * 1000, message: 'Second reminder: Don\'t forget your cart!' }, // 1 day
{ delay: 3 * 24 * 60 * 60 * 1000, message: 'Final reminder: Your cart is waiting!' }  // 3 days
];

// Store abandoned checkouts and reminders sent
let abandonedCheckouts = {};

// Handle checkout abandoned webhook
app.post('/webhook/checkout-abandoned', (req, res) => {
  const checkoutData = req.body;
  const { id, email } = checkoutData.customer;

  if (!abandonedCheckouts[id]) {
    abandonedCheckouts[id] = { checkoutData, remindersSent: [], orderPlaced: false };

    recoverySchedule.forEach((scheduleItem) => {
      schedule.scheduleJob(Date.now() + scheduleItem.delay, async function() {
        if (!abandonedCheckouts[id].orderPlaced) {
          const timeSent = new Date().toISOString();
          await sendReminderEmail(email, scheduleItem.message);
          abandonedCheckouts[id].remindersSent.push({ email, message: scheduleItem.message, timeSent });
        }
      });
    });
  }

  res.status(200).send('Checkout abandoned webhook received');
});

// Handle order placed webhook
app.post('/webhook/order-placed', (req, res) => {
  const orderData = req.body.order;
  const { id } = orderData.customer;

  console.log('Order Placed Webhook Received:', orderData);

  if (abandonedCheckouts[id]) {
    abandonedCheckouts[id].orderPlaced = true;
    console.log(`Order placed for customer ID: ${id}`);
  } else {
    console.log(`No abandoned checkout found for customer ID: ${id}`);
  }

  res.status(200).send('Order placed webhook received');
});

// Function to send reminder email
async function sendReminderEmail(email, message) {
  // Dummy email sender using axios 
  await axios.post('https://your-email-service.com/send', { email, message });
}

// Endpoint to get sent messages
app.get('/api/messages', (req, res) => {
  const messages = [];
  
  for (let checkout of Object.values(abandonedCheckouts)) {
    checkout.remindersSent.forEach(reminder => {
      messages.push(reminder);
    });
  }
  
  res.json(messages);
});

// Endpoint to get orders (for completeness, depending on your frontend)
app.get('/api/orders', (req, res) => {
  const orders = [];
  
  for (let checkout of Object.values(abandonedCheckouts)) {
    if (checkout.orderPlaced) {
      orders.push(checkout.checkoutData);
    }
  }

  console.log('Orders Array:', orders);
  
  res.json(orders);
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
