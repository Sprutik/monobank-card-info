# Monobank Card Info

A Next.js application that allows you to view your Monobank card transactions using the Monobank API.

## Features

- View your Monobank card transactions
- Beautiful UI with dark/light mode support
- Secure token handling using environment variables
- Responsive design

## Prerequisites

- Node.js 18+ installed
- A Monobank API token (you can get it from the Monobank app)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/monobank-card-info.git
cd monobank-card-info
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Monobank API token:
```bash
MONOBANK_API_TOKEN=your_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Get Your Monobank API Token

1. Open the Monobank app
2. Go to Settings
3. Find "API Token" or "Personal API"
4. Copy your token

## Security Note

The application handles your Monobank API token securely:
- The token is stored in environment variables
- The token is never exposed to the client
- The token is not committed to version control

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Monobank API

## License

MIT 