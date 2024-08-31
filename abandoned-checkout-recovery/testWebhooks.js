const axios = require('axios');
const fs = require('fs');
const path = require('path');

const testWebhook = async (filePath, url) => {
  try {
    // Read the JSON data from the file
    const data = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    const jsonData = JSON.parse(data);

    // Send a POST request to the webhook URL
    const response = await axios.post(url, jsonData);

    // Log the response from the server
    console.log(`Webhook test for ${url} completed:`, response.status, response.statusText);
  } catch (error) {
    console.error(`Error testing webhook for ${url}:`, error.message);
  }
};

const checkReminderMessage = async () => {
  try {
    // Fetch messages and orders from the server
    const messagesResponse = await axios.get('http://localhost:3000/api/messages');
    const ordersResponse = await axios.get('http://localhost:3000/api/orders');

    const messages = messagesResponse.data;
    const orders = ordersResponse.data;

    // Check if the reminder message should be displayed
    if (messages.length === 0 && orders.length === 0) {
      console.log("Reminder Message: You have items in your cart! Don't forget to proceed to checkout.");
    } else {
      console.log("Messages or orders exist, no reminder needed.");
    }
  } catch (error) {
    console.error('Error fetching messages or orders:', error.message);
  }
};

const runTests = async () => {
  // Test the checkout abandoned webhook
  await testWebhook('test-data/AbandonedCheckout.txt', 'http://localhost:3000/webhook/checkout-abandoned');

  // Wait for a moment to allow the server to process the reminder
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

  // Test the order placed webhook
  await testWebhook('test-data/Order.txt', 'http://localhost:3000/webhook/order-placed');

  // Fetch and log all sent messages to verify that they were handled correctly
  try {
    const messagesResponse = await axios.get('http://localhost:3000/api/messages');
    console.log('Sent Messages:', messagesResponse.data);
  } catch (error) {
    console.error('Error fetching sent messages:', error.message);
  }

  // Fetch and log all orders to verify that the order was processed correctly
  try {
    const ordersResponse = await axios.get('http://localhost:3000/api/orders');
    console.log('Orders:', ordersResponse.data);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
  }

  // Check and log whether the reminder message should be displayed
  await checkReminderMessage();
};

runTests();
