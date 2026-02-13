# 🔖 Smart Bookmark App

A modern real-time bookmark manager built with **Next.js + Supabase + Tailwind CSS**.

## ✨ Features

- 🔐 Google OAuth authentication (Supabase Auth)
- 👤 Private bookmarks per user (RLS enabled)
- ➕ Add bookmarks (Title + URL)
- ✏️ Edit bookmarks
- ❌ Delete bookmarks
- 🔎 Live search by title
- ⏱ Created & Updated timestamp (IST)
- 🚫 Prevent duplicate URLs per user
- ⚡ Real-time sync using Supabase Realtime
- 🎨 Modern glassmorphism UI with animations
- 🌐 Ready for Vercel deployment

---

## 🛠 Tech Stack

- **Next.js (App Router)**
- **Supabase (Auth + Database + Realtime)**
- **Tailwind CSS**
- **Vercel (Deployment)**

---

## 🔑 Environment Variables

Create `.env.local` in root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
