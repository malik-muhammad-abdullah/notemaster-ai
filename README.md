This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# NoteMaster AI

NoteMaster AI is a powerful AI-powered note-taking and learning assistant that helps you manage your studies, tasks, and more.

## Features

- AI-powered chat for learning assistance
- Study guide generation
- Text summarization
- Quiz generation
- Real-time text tutoring
- Coding assistance
- Task management with email reminders

## Task Management

The task management feature allows you to:

- Create tasks with titles, descriptions, due dates, and priorities
- Set multiple reminders for each task (e.g., 5 minutes, 1 hour, or 1 day before due date)
- Receive email notifications for task reminders
- Mark tasks as complete
- Delete tasks when no longer needed

### Setting Up Email Reminders with Gmail

1. Set up Gmail App Password (2FA must be enabled):

   - Go to your Google Account settings
   - Navigate to Security
   - Under "Signing in to Google," select "2-Step Verification"
   - At the bottom, select "App passwords"
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

2. Add the following environment variables to your `.env` file:

   ```
   EMAIL_USER=your.email@gmail.com
   EMAIL_APP_PASSWORD=your-16-character-app-password
   CRON_SECRET=your_random_secret_string
   ```

3. Set up a cron job to check for reminders every minute:
   ```bash
   * * * * * curl -X GET -H "Authorization: Bearer your_random_secret_string" https://your-domain.com/api/cron/check-reminders
   ```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env`:
   ```
   DATABASE_URL=your_database_url
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   EMAIL_USER=your.email@gmail.com
   EMAIL_APP_PASSWORD=your-16-character-app-password
   CRON_SECRET=your_random_secret_string
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
