# Personal AI Job Tracker

## 📌 Project Overview

A lightweight, user-friendly personal job tracking platform designed to replace traditional spreadsheet trackers (e.g., Google Sheets). This platform serves as a personal workspace for job seekers to manage their application pipeline while leveraging Generative AI to automate data entry, tailor documents, and prepare for interviews.

## 🎯 Primary Goals

1.  **Reduce Friction:** Minimize manual data entry when saving job postings.
2.  **Clear Visualization:** Provide an intuitive, easy-to-read pipeline of job application statuses.
3.  **AI Assistance:** Act as a personal career assistant for tailoring resumes, drafting emails, and practicing interview questions.

---

## ⚙️ Tech Stack & Architecture

This project utilizes a modern full-stack ecosystem. When generating code or suggesting architectural patterns, please adhere to the following stack:

- **Frontend:** React.js / Next.js (or Vite), styled with Tailwind CSS.
- **UI Components:** shadcn/ui for accessible, highly customizable, and premium UI components. Priority should be given to Radix UI primitives utilized by shadcn.
- **Backend:** Node.js with Express framework.
- **Database & ORM:** Relational database managed via Prisma ORM.
- **AI Integration:** Google Generative AI (Gemini SDK) for parsing, generating, and tailoring text.
- **Deployment:** Vercel (Frontend/Fullstack) or Render (Backend).

---

## 🤖 Instructions for AI Agents (Claude, Gemini, etc.)

When acting as a coding assistant for this project, please observe the following guidelines:

1.  **Component Styling:** Use tailwind utility classes. For UI elements, assume the presence of shadcn/ui components (e.g., `<Button>`, `<Card>`, `<Input>`, `<Dialog>`) and generate code using these patterns rather than raw HTML elements.
2.  **AI Prompts:** When writing backend logic for AI integration (using Gemini SDK), ensure the prompts explicitly request output in clean `JSON` format when data needs to be populated into frontend forms or Prisma schemas.
3.  **Database Queries:** Use standard Prisma Client syntax for CRUD operations related to job applications and user profiles.

---

## 🚀 Core Features (Standard Tracking)

### 1. Dual-View Pipeline

- **Kanban Board:** Drag-and-drop interface for tracking stages (e.g., _Wishlist_, _Applied_, _Interviewing_, _Offered_, _Rejected_).
- **Table View:** Spreadsheet-like view for quick scanning and sorting.

### 2. Application Details & Notes

- **Quick Add:** Form to manually input Company, Role, Salary Range, URL, Date, and Contacts.
- **Interactive Workspace:** Each job card contains a dedicated space for personal notes, preparation checklists, and deadline reminders.

---

## 🧠 AI-Powered Features (Generative AI Integration)

### 1. Smart JD Parser

- **Function:** User pastes a raw Job Description (JD) text or link.
- **AI Action:** Extracts key data points (Company Name, Role, Required Tech Stack, Salary) and formats them into a structured JSON payload to auto-fill the application form.

### 2. Resume & Cover Letter Tailoring

- **Function:** User stores a base resume profile.
- **AI Action:** Compares the base profile against a specific JD to highlight missing keywords, suggest resume tweaks, and generate a tailored Cover Letter draft.

### 3. Interview Simulator

- **Function:** Generates practice questions based on the specific job role and required tech stack.
- **AI Action:** Provides a list of potential technical and behavioral questions, along with bullet-point suggestions for answering them using the STAR method.

### 4. Smart Email Drafter

- **Function:** Generates professional email templates.
- **AI Action:** Drafts context-aware emails for follow-ups, thank-you notes post-interview, or polite offer declines.

---

## 🤖 Instructions for AI Agents (Claude, Gemini, etc.)

When acting as a coding assistant for this project, please observe the following guidelines:

1.  **Component Styling:** Prioritize Tailwind CSS utility classes and DaisyUI pre-built components for UI consistency.
2.  **AI Prompts:** When writing backend logic for AI integration (using Gemini SDK), ensure the prompts explicitly request output in clean `JSON` format when data needs to be populated into frontend forms or Prisma schemas.
3.  **Database Queries:** Use standard Prisma Client syntax for CRUD operations related to job applications and user profiles.
4.  **Tone:** Keep the UI copy and system messages friendly, encouraging, and clear.
