# Voice AI Interview Platform

This is a simple voice AI interview platform built with Next.js and Millis AI SDK.

## Features

- User-friendly interview setup form
- Voice-based AI interviews
- Support for different interview types and job positions
- Real-time audio visualization
- Transcript display of both user and AI responses

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Millis AI account with API credentials

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Millis AI credentials:
   ```
   NEXT_PUBLIC_MILLIS_PUBLIC_KEY="Your PUBLIC KEY"
   NEXT_PUBLIC_MILLIS_AGENT_ID="AGENT ID"
   NEXT_PUBLIC_MILLIS_REGION_ENDPOINT="Region Endpoint"
   ```
   You can get these values from your Millis AI dashboard.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Fill out the interview form with your name and optional interview details
2. Click "Start Interview" to proceed to the interview page
3. Click "Connect to Millis" to initialize the voice AI
4. Once connected, click "Start Interview" to begin the AI interview
5. Speak clearly into your microphone to interact with the AI interviewer
6. View real-time transcripts of your conversation
7. Click "End Interview" when you're finished

## Environment Variables

- `NEXT_PUBLIC_MILLIS_PUBLIC_KEY`: Your Millis public key
- `NEXT_PUBLIC_MILLIS_AGENT_ID`: The ID of your Millis agent
- `NEXT_PUBLIC_MILLIS_REGION_ENDPOINT`: Your Millis region endpoint

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Millis AI SDK

## License

This project is licensed under the MIT License.
