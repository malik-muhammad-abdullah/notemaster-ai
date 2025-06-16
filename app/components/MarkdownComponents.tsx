import type { Components } from "react-markdown";

// Custom components for markdown rendering
export const MarkdownComponents: Partial<Components> = {
  h1: ({ node, ...props }: any) => (
    <h1
      className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className="text-lg font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200"
      {...props}
    />
  ),
  p: (props: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="mb-4 leading-7">{props.children}</p>
  ),
  ul: ({ node, depth = 0, ...props }: any) => (
    <ul
      className={`mb-4 ${depth === 0 ? "space-y-2" : "mt-2"} list-disc ml-${
        depth ? "8" : "4"
      }`}
      {...props}
    />
  ),
  li: ({ node, ordered, ...props }: any) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
  code: ({ node, ...props }: any) => (
    <code
      className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
      {...props}
    />
  ),
  pre: ({ node, ...props }: any) => (
    <pre
      className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto"
      {...props}
    />
  ),
};
