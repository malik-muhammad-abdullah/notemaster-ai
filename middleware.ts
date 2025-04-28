export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/chat',
    '/study-guide',
    '/summarization',
    '/coding-assistant',
    '/quiz-generation',
    '/real-time-text-tutoring',
  ],
};
