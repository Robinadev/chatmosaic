# Chatmosaic

Custom AI chatbots for NGOs, no‑code deployment

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Embeddable Chatbot Widgets

Chatmosaic is designed to help NGOs offer a branded AI chatbot directly on their websites. Each organization can tailor the widget to its identity—such as its name, logo, colors, welcome message, and support content—then share a small embed snippet with its web team. Visitors can open the chat without leaving the NGO’s site.

A deployed widget can be added to a page with a script tag like this:

```html
<script
  src="https://your-chatmosaic-domain.example/widget.js"
  data-chatbot-id="your-chatbot-id"
  data-primary-color="#2563eb"
  data-organization-name="Your NGO"
  async
></script>
```

Replace the example domain and chatbot ID with the values provided for your deployed chatbot. The widget script should load the organization’s configured branding and chatbot experience. Keep any private API keys on the server; only use public identifiers in website embed code.

> The snippet above illustrates the intended integration. A production widget script and chatbot configuration flow must be deployed before it can be used on a live website.

## Project Structure

- `src/app/page.tsx` - Main page
- `src/app/layout.tsx` - Root layout
- `src/components/ui/` - Shadcn UI components
- `src/lib/utils.ts` - Utility functions
