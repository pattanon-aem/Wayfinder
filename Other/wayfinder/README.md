# Wayfinder - Setup Guide

## Prerequisites

- Node.js installed
- Yarn package manager installed
- ngrok installed (for webhook testing, otherwise the user initialisation
  )

## Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory and add the environment variables that will be provided to you in the chat.

### 3. Start the Development Server

```bash
yarn dev
```

The application will start running at `http://localhost:3000`

### 4. Set Up ngrok for Webhooks

In a **new terminal window**, run:

```bash
ngrok http 3000
```

**Important:** Copy the ngrok URL (it will look like `https://xxxx-xx-xx-xxx-xxx.ngrok-free.app`) and send it to the chat so we can update the Clerk webhook configuration.

## You're All Set!

Once the webhook is configured, you can access the application at `http://localhost:3000`
