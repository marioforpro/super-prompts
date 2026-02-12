# Super Prompts — Phase 1 MVP Design

## Overview

Super Prompts is a visual prompt management tool for creatives who use generative AI tools (Midjourney, Runway, Kling, Sora, DALL-E, etc.). Phase 1 builds the core product: a web app prompt library with visual previews, a Chrome extension for capturing prompts from anywhere, and lightweight sharing via links.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage, RLS)
- **Hosting**: Vercel
- **Extension**: Chrome Extension (Manifest V3)
- **Fonts**: DM Sans (display/body), Space Mono (mono/labels)

---

## Phase 1a: Auth + Prompt Library (Web App)

### Database Schema

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, FK → auth.users) | |
| display_name | text | |
| avatar_url | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

#### `ai_models`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | "Midjourney", "Runway", etc. |
| slug | text (unique) | "midjourney", "runway" |
| category | text | "image", "video", "text", "audio", "3d" |
| icon_url | text | nullable, for model icons |
| is_default | boolean | true = pre-seeded, false = user-added |
| created_at | timestamptz | |

Pre-seeded models: Midjourney, DALL-E 3, Stable Diffusion, Runway, Kling, Sora, VEO, Pika, Leonardo AI, Freepik AI, ChatGPT, Claude, Flux, Higgsfield, Nano Banana Pro.

#### `folders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | |
| name | text | |
| color | text | hex color for visual ID |
| sort_order | integer | for custom ordering |
| created_at | timestamptz | |

#### `tags`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | |
| name | text | |
| color | text | nullable |
| created_at | timestamptz | |

Unique constraint: (user_id, name) — no duplicate tag names per user.

#### `prompts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | |
| folder_id | uuid (FK → folders) | nullable (unfiled) |
| model_id | uuid (FK → ai_models) | nullable |
| title | text | |
| content | text | the actual prompt text |
| notes | text | nullable, user's personal notes |
| source_url | text | nullable, where the prompt was found |
| is_favorite | boolean | default false |
| is_public | boolean | default false |
| share_slug | text (unique) | nullable, generated on share |
| primary_media_id | uuid (FK → prompt_media) | nullable, cover image/video |
| is_featured | boolean | default false, admin-curated |
| featured_category | text | nullable, e.g. "photo_restoration", "cinematic_vfx" |
| featured_at | timestamptz | nullable, when it was featured |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `trend_insights`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| title | text | e.g. "Photo Restoration" |
| description | text | trend context from /last30days research |
| category_slug | text | matches featured_category on prompts |
| trend_score | integer | 1-100 hotness ranking |
| source_data | jsonb | raw research data from /last30days |
| is_active | boolean | show on dashboard or not |
| week_of | date | which week this trend applies to |
| created_at | timestamptz | |

#### `prompt_tags` (junction)
| Column | Type | Notes |
|--------|------|-------|
| prompt_id | uuid (FK → prompts) | |
| tag_id | uuid (FK → tags) | |
| PK | (prompt_id, tag_id) | |

#### `prompt_media`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| prompt_id | uuid (FK → prompts) | |
| type | text | "image" or "video" |
| storage_path | text | path in Supabase Storage |
| thumbnail_path | text | nullable, generated thumbnail |
| original_url | text | nullable, source URL of the media |
| file_size | integer | bytes |
| sort_order | integer | for gallery ordering |
| created_at | timestamptz | |

### Auth

- **Google OAuth**: via Supabase Auth, one-click sign-in
- **Email + Password**: with email confirmation
- **Session handling**: `@supabase/ssr` package for Next.js App Router
- **Middleware**: protect `/dashboard/*` routes, redirect unauthenticated users to `/login`
- **Profile creation**: auto-create `profiles` row on first sign-in via Supabase trigger

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only CRUD their own prompts, folders, tags, and media
- `ai_models` where `is_default = true` are readable by all
- `prompts` where `is_public = true` are readable by all (for share links)
- `prompt_media` inherits access from its parent prompt

### App Routes

```
/                     → Landing page (existing)
/login                → Sign in (Google + Email/Password)
/signup               → Create account
/dashboard            → Prompt library (main view)
/dashboard/folders    → Folder management
/dashboard/settings   → Account settings
/p/[slug]             → Public shared prompt page
```

### Dashboard Layout

```
┌──────────────────────────────────────────────────┐
│  Logo        Search bar              [+ New]  👤  │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ All      │  Grid / List toggle                   │
│ Favorites│                                       │
│ ──────── │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ FOLDERS  │  │cover│ │cover│ │cover│ │cover│    │
│ > Video  │  │img  │ │img  │ │vid  │ │img  │    │
│ > Image  │  │title│ │title│ │title│ │title│    │
│ > Text   │  │tags │ │tags │ │tags │ │tags │    │
│ ──────── │  └─────┘ └─────┘ └─────┘ └─────┘    │
│ AI MODELS│                                       │
│ Midj.    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ Runway   │  │     │ │     │ │     │ │     │    │
│ Kling    │  │     │ │     │ │     │ │     │    │
│ ──────── │  │     │ │     │ │     │ │     │    │
│ TAGS     │  │     │ │     │ │     │ │     │    │
│ #cine..  │  └─────┘ └─────┘ └─────┘ └─────┘    │
│ #port..  │                                       │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

### Key Interactions

- **One-click copy**: click copy icon on any prompt card → clipboard
- **Quick preview**: hover on video cover → auto-play loop (muted)
- **Drag & drop**: drag prompts between folders in sidebar
- **Bulk actions**: shift-click to select multiple → move, tag, delete
- **Search**: full-text search across title, content, notes, tags
- **Filters**: combine folder + model + tag filters
- **Sort**: by date created, date modified, alphabetical, favorites first

### Create/Edit Prompt Modal

Fields:
1. **Title** — required
2. **Prompt text** — required, large textarea
3. **Folder** — dropdown, optional (defaults to unfiled)
4. **AI Model** — dropdown with search, optional
5. **Tags** — multi-select with type-to-create
6. **Notes** — optional textarea
7. **Source URL** — optional, paste a link
8. **Media** — upload zone + URL extraction results
   - When source URL is pasted, app extracts media and shows selectable grid
   - Manual upload via drag & drop or clipboard paste
   - User selects which media to keep
   - User picks primary cover (star icon on thumbnail)

---

## Phase 1b: Chrome Extension

### Manifest V3 Structure

```
super-prompts-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/
│   └── service-worker.js
├── content/
│   └── content-script.js
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── utils/
    └── api.js
```

### Why the Extension is Essential for Media Capture

Server-side extraction from social media platforms is blocked or deprecated:
- **Instagram**: Meta deprecated oEmbed API (April 2025). Now requires paid developer app.
- **X/Twitter**: oEmbed returns only HTML snippets, not image URLs. Full API requires paid access.
- **LinkedIn**: No public API for post media extraction.

The Chrome extension is the ONLY free, reliable way to grab media from these platforms because
it runs inside the user's authenticated browser session and reads the rendered DOM directly.

### Features

#### Save Prompt — Single Smart Context Menu

One menu item: **"Save to Super Prompts"** — the extension detects context and adapts:

**If text is highlighted** → captures text as prompt, scans surrounding post for media
**If right-clicked on an image** → sends to Claude Vision for analysis, extracts prompt text + result
**If right-clicked on empty space in a post** → scans entire post container for text + media

##### Platform-Specific DOM Scanning

**Instagram:**
- Post images: traverse DOM layers, find `<img>` elements with `srcset`, extract highest-res src
- Carousel: detect carousel indicators, grab all loaded frames (note: unloaded slides can't be scraped — show "X of Y images loaded" message)
- Videos/Reels: capture `<video>` poster frame as thumbnail + save video URL
- Caption text: extract from post description elements

**X/Twitter:**
- Tweet images: `div[data-testid="tweetPhoto"] img`
- Tweet videos: `div[data-testid="videoComponent"] video` + poster frame
- Tweet text: `div[data-testid="tweetText"]`
- Auto-expand: detect "Show more" button and click it before capturing truncated tweets

**LinkedIn:**
- Post images: media elements within `.feed-shared-update-v2` containers
- Post text: description elements within feed item containers
- Auto-expand: detect "...see more" button and click it before capturing truncated posts

**Generic fallback (any other site):**
- Find all `<img>` and `<video>` near selected text (within shared parent container)
- Extract `og:image` and `og:video` from page meta tags
- Filter out tiny images (icons, avatars) by minimum size threshold (200x200px)

##### Post Boundary Detection
When user right-clicks in a feed, the extension traverses UP the DOM from the click point to find
the nearest post container boundary. This ensures it captures content from the correct post, not
adjacent posts in the feed.

##### Smart Media Extraction + Relevance Scoring

The extension doesn't grab everything — it scores each found element by relevance:

**Filtering rules (discard immediately):**
- Images below 200×200px (icons, avatars, UI elements)
- Known UI patterns: navigation icons, ad banners, site logos, emoji images
- Images outside the post container boundary
- Duplicate images (same src or same dimensions+position)

**Relevance scoring (higher score = pre-checked in save panel):**
- **Proximity**: media physically closer in the DOM to selected text / clicked element → higher score
- **Size**: larger images/videos → higher score (likely content, not UI)
- **Source quality**: images with `srcset` (high-res available) → higher score
- **Container match**: media inside the same post/article container as the text → higher score
- **Platform signals**: on X, the tweet's own media attachments → highest score (vs. quoted tweet media or reply media which score lower)
- **Content type**: `<video>` elements within post → high score (likely AI-generated result)

**Pre-check logic:**
- Score ≥ 70% confidence → pre-checked ☑ (user likely wants this)
- Score 30-69% → shown but unchecked ☐ (user can opt in)
- Score < 30% → filtered out entirely (noise)

##### The Save Panel — User Approval Flow

The user ALWAYS reviews and approves what gets saved. Nothing is saved automatically.

```
┌──────────────────────────────────────────────────┐
│ Save to Super Prompts                       [×]  │
├──────────────────────────────────────────────────┤
│ Title: [Cinematic portrait rest...]              │  ← auto-generated
│                                                  │
│ Prompt:                                          │
│ ┌──────────────────────────────────────────────┐ │
│ │ Cinematic portrait restoration. Strictly     │ │  ← pre-filled, editable
│ │ preserve original pose, expression, and      │ │
│ │ composition. Add warm golden-hour side...    │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Model: [Nano Banana Pro  ▾]                      │  ← auto-detected
│ Folder: [Unfiled          ▾]                     │
│ Tags: [cinematic] [portrait] [×] [+ add]         │  ← AI-suggested, removable
│                                                  │
│ Media found on page (5):          [+ Upload]     │
│ ┌────────┐ ┌────────┐ ┌────────┐                │
│ │ ☑  ★  │ │ ☑     │ │ ☐     │                │
│ │restored│ │original│ │ profile│  ← unchecked    │
│ │ photo  │ │ photo  │ │  pic  │    (low score)   │
│ └────────┘ └────────┘ └────────┘                │
│ ┌────────┐ ┌────────┐                            │
│ │ ☐     │ │ ☐     │                            │
│ │ ad    │ │ other │  ← unchecked (low score)    │
│ │ banner│ │ tweet │                              │
│ └────────┘ └────────┘                            │
│                                                  │
│ ★ = cover image (click any thumbnail to change)  │
│ ☑ = will be saved  ☐ = won't be saved            │
│                                                  │
│ Source: x.com/image_gpt/status/...               │
│                                                  │
│           [ Save Prompt ]                        │
└──────────────────────────────────────────────────┘
```

**User controls:**
- ☑/☐ **Toggle checkboxes** to include or exclude any media item
- ★ **Click any thumbnail** to set it as the primary cover for the library grid
- **[+ Upload]** button to manually add media the extension missed
- **Edit any field** — title, prompt text, model, folder, tags are all editable
- **Remove AI-suggested tags** with the × button on each tag pill
- **Nothing saves until the user clicks "Save Prompt"** — full user control

Smart defaults:
- **Auto-generated title**: first ~50 characters of prompt text (editable)
- **Auto-suggested tags**: Claude analyzes prompt content and suggests 2-3 tags (removable)
- **Auto-detected model**: from page domain or text context (editable)
- **Primary cover**: highest-scoring image auto-selected as ★ (changeable)
- **Pre-checked media**: only high-confidence items are pre-checked; low-confidence shown but unchecked

#### Quick Save (Clipboard Notification)

When user copies text (Cmd+C / Ctrl+C) on a supported social media site:
1. Extension detects the copy event on Instagram, X, LinkedIn, AI tool sites
2. Analyzes copied text — does it look like a prompt? (contains descriptive language, style keywords, model names)
3. If likely a prompt, shows a subtle floating bubble near the cursor:
   "Save as prompt? [Save] [×]"
4. One click → saves instantly with smart defaults (auto-detected model, auto-generated title, scanned media from surrounding DOM)
5. Bubble auto-dismisses after 5 seconds if ignored
6. Can be toggled off in extension settings

#### Auto-Detect AI Tool
Domain mapping for model pre-selection:
- `midjourney.com` / `discord.com` (with Midjourney channels) → Midjourney
- `runwayml.com` → Runway
- `klingai.com` → Kling
- `chat.openai.com` → ChatGPT
- `claude.ai` → Claude
- `leonardo.ai` → Leonardo AI
- `pika.art` → Pika
- `freepik.com` → Freepik AI
- `higgsfield.ai` → Higgsfield
- `sora.com` → Sora
- etc.

Also detects model names mentioned in post text (e.g., "made with Kling" → auto-select Kling).

#### Paste Prompt (Extension Popup)

1. User clicks extension icon in toolbar
2. Compact popup opens with visual grid of recent prompts (cover thumbnails)
3. **Smart filter**: auto-highlights the current AI tool based on what site user is on
   - On midjourney.com → shows Midjourney prompts first
   - On runwayml.com → shows Runway prompts first
   - Quick filter tabs: `All | ⭐ | Midjourney | Kling | Runway | ...`
4. Search bar for finding specific prompts
5. Click a prompt → detail view with two actions:
   - **"Copy"** → copies prompt text to clipboard, shows "Copied!" toast
   - **"Insert"** → directly types prompt into the active input field on the page

##### Direct Insert (Platform-Specific Input Detection)
The "Insert" button finds the active text input on the current page:
- Discord message box (for Midjourney /imagine)
- ChatGPT main textarea
- Runway prompt input field
- Kling generation prompt area
- Generic: any currently focused `<textarea>` or `contentEditable` element

```
Extension Popup Layout:
┌──────────────────────────────┐
│ 🔍 Search prompts...         │
├──────────────────────────────┤
│ [All] [⭐] [Midj] [Kling]   │  ← auto-highlights current tool
├──────────────────────────────┤
│ ┌───────┐ ┌───────┐         │
│ │ cover │ │ cover │         │
│ │ Title │ │ Title │         │
│ │ model │ │ model │         │
│ └───────┘ └───────┘         │
│ ┌───────┐ ┌───────┐         │
│ │ cover │ │ cover │         │
│ │ Title │ │ Title │         │
│ └───────┘ └───────┘         │
├──────────────────────────────┤
│     [Open Full Library →]    │
└──────────────────────────────┘
```

#### Auth
- Extension checks for active Supabase session via `chrome.cookies`
- If not signed in, shows "Sign in at superprompts.app" link
- Opens web app login in a new tab, extension detects session after login
- Session persists until user logs out

#### Edge Cases Handled

1. **Carousel with unloaded images**: Show "Loaded X of Y images" — don't try to auto-navigate (janky)
2. **Truncated text ("...see more")**: Auto-expand before capture. If expansion fails, capture visible text + flag "Text may be truncated"
3. **No prompt text found (image only)**: Open save panel with image as preview + empty prompt field. User adds text manually or later.
4. **Multiple posts in feed**: Post boundary detection ensures only the clicked post's content is captured
5. **Video content**: Capture poster frame as thumbnail + save video source URL for library playback

### Image Analysis (Claude Vision)

Users often encounter prompts as screenshots — a tweet with prompt text + result image, an Instagram
post with the prompt overlaid on the generated image, etc. Rather than making users manually type
out the prompt, the app can analyze the image and extract everything automatically.

**Flow:**
1. User right-clicks an image → "Analyze with Super Prompts" (extension)
   OR drags/pastes a screenshot into "New Prompt" form (web app)
2. Image sent to Next.js API route (`/api/analyze-image`)
3. API calls Claude Vision (Anthropic API) with structured prompt:
   - Extract the prompt text visible in the image
   - Identify the AI model name if mentioned
   - Identify and describe the AI-generated result image(s)
   - Return structured JSON
4. Save form pre-fills: prompt text, model, image as preview
5. User reviews, adjusts if needed, saves

**Claude Vision prompt template:**
```
Analyze this image from a social media post about AI-generated content.
Extract and return as JSON:
{
  "prompt_text": "the actual prompt text visible in the image",
  "model_name": "the AI model mentioned (e.g. Midjourney, Nano Banana Pro) or null",
  "has_result_image": true/false,
  "description": "brief description of the AI-generated result shown"
}
```

**Cost:** ~$0.01-0.03 per analysis. Negligible at MVP scale.

**API key:** Anthropic API key stored as Vercel environment variable. Only called server-side.

### Extension Onboarding: Platform Login Guide

The extension needs users to be logged into social platforms for DOM scraping to work.
On first install, show a simple onboarding screen:

1. "For the best experience, make sure you're signed into these platforms:"
2. Checklist with icons: Instagram ☐ | X/Twitter ☐ | LinkedIn ☐
3. As user visits each platform while logged in, the extension detects it and checks the box
4. "You're all set!" once platforms are detected
5. Can be revisited from extension settings

Also show a contextual tip when scraping fails: "Couldn't find media on this page.
Make sure you're logged into [platform name] and try again."

### Media Capture Strategy Summary

| Method | Works On | Reliability | Notes |
|--------|----------|-------------|-------|
| Chrome Extension DOM scanning | Instagram, X, LinkedIn, any site | High | Primary method. Reads rendered page. |
| Image Analysis (Claude Vision) | Screenshots, any image with text | High | Extracts prompt text + identifies result images from screenshots |
| Server-side OG tag extraction | Blogs, forums, open sites | Medium | Fallback for "Paste URL" in web app |
| Manual upload (drag/drop/paste) | Anywhere | Always works | User's ultimate fallback |

For the web app "Paste URL" feature: attempt server-side OG extraction first. If blocked (Instagram, X, LinkedIn), show friendly message: "Can't extract media from this link automatically. Use the Chrome extension or upload images manually."

---

## Phase 1c: Share via Link

### Flow

1. User clicks "Share" on a prompt
2. App generates a unique `share_slug` (e.g., "a3f8k2")
3. Sets `is_public = true` on the prompt
4. Shows shareable URL: `superprompts.app/p/a3f8k2`
5. User copies link, shares it anywhere

### Public Prompt Page (`/p/[slug]`)

- Shows the prompt title, full text, AI model, tags
- Shows media gallery (images/videos)
- "Copy Prompt" button (works for anyone)
- "Save to My Library" button (requires sign-in → redirects to auth if needed)
- OG meta tags for rich social previews when link is shared on Twitter/LinkedIn/etc.
- Creator attribution: "Shared by [display_name]"

### Privacy

- Only prompts explicitly marked as public are accessible
- User can revoke sharing at any time (toggle off → slug still exists but returns 404)
- No browsing/discovery of public prompts (that's Phase 2)

---

## Phase 1d: Trending Prompts Section

### Overview

The Trending section solves the "empty room" problem — new users see curated, high-quality
prompts immediately. It also keeps existing users coming back to see what's new.

Two layers working together:

### Layer 1 — Curated Seed Content (the prompts + previews)

Mario curates 50-100 amazing prompts from social media using the Chrome extension.
Each prompt has real preview images/videos, real prompt text, proper model attribution.

Prompts are marked with `is_featured = true` and assigned a `featured_category`:
- "photo_restoration" — Nano Banana Pro cinematic restorations
- "cinematic_vfx" — Kling/Runway visual effects
- "fashion_editorial" — AI fashion photography
- "character_design" — Character concepts and illustrations
- "video_transitions" — Viral video effects
- "product_photography" — Commercial product shots
- etc.

These categories map to Higgsfield-style gallery sections on the dashboard:

```
Dashboard home for new/returning users:

┌─────────────────────────────────────────────────────┐
│ Your Library (12 prompts)              [+ New]  👤  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🔥 TRENDING: PHOTO RESTORATION                      │
│ Cinematic portrait restoration is blowing up        │
│ this week on X and LinkedIn                         │
│                                                     │
│ [Nano Banana Pro] [Before/After] [Upscale] [8K]    │
│                                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │    │ │    │ │    │ │    │ │    │                │
│ └────┘ └────┘ └────┘ └────┘ └────┘                │
│                                                     │
│ CINEMATIC VFX                                       │
│ Kling 2.5 transitions dominate the feed             │
│                                                     │
│ [Kling] [Transitions] [Fire] [Smoke]                │
│                                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │    │ │    │ │    │ │    │ │    │                │
│ └────┘ └────┘ └────┘ └────┘ └────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

When a user clicks a trending prompt:
- Full prompt detail view opens
- "Copy Prompt" one-click button
- "Save to My Library" button (adds to their personal collection)
- Preview media gallery (images + videos)
- Model, tags, source attribution

### Layer 2 — /last30days Trend Intelligence (the context)

The `/last30days` skill is run weekly (manually or scheduled) to research what's trending
in the AI creative community across Reddit, X, and the web.

**What it provides:**
- **Trend headlines**: "Photo Restoration prompts are trending on X"
- **Trend descriptions**: Why it's trending, what's driving it
- **Hot models**: Which AI models are getting the most buzz this week
- **Popular styles**: Cinematic, editorial, comic, retro, etc.

**How it's used in the app:**
1. **Section headlines**: Dynamic copy for each trending category
   (e.g., "Cinematic portrait restoration is blowing up this week")
2. **Trend badges**: 🔥 badge on prompts that match current hot topics
3. **"What's Hot" sidebar widget**: 3-5 trend cards showing current AI creative trends
4. **Model ranking**: Shows which AI models are most talked about this week

**The workflow:**
1. Run /last30days with queries like "trending AI image prompts", "viral AI video effects",
   "popular Midjourney styles", "Kling Runway Sora trending"
2. Store results in `trend_insights` table
3. Dashboard renders trend context alongside curated prompts
4. Refresh weekly to keep it current

### Content Curation Workflow for Mario

1. Browse Instagram, X, LinkedIn daily (you already do this)
2. When you find an amazing prompt → use the Chrome extension to save it
3. In the web app, mark it as "Featured" and assign a category
4. Weekly: run /last30days to update trend context
5. The dashboard auto-assembles: trending categories + curated prompts + trend copy

---

## Implementation Order

### Phase 1a — Auth + Library (estimated: ~3-4 sessions)

1. **Database setup**: Create all tables, RLS policies, triggers in Supabase
2. **Auth pages**: `/login`, `/signup` with Google + Email/Password
3. **Dashboard layout**: sidebar, top bar, responsive shell
4. **Prompt CRUD**: create, read, update, delete prompts
5. **Folders**: create, rename, delete, drag prompts into folders
6. **Tags**: create, assign, filter
7. **AI Models**: pre-seed, model picker
8. **Media handling**: upload images/videos, URL extraction, primary cover selection
9. **Image analysis API**: `/api/analyze-image` endpoint using Claude Vision
10. **Search + filters**: full-text search, combine filters
11. **Grid + List views**: toggle, responsive

### Phase 1b — Chrome Extension (estimated: ~2-3 sessions)

11. **Extension scaffold**: Manifest V3, popup UI, service worker
12. **Save flow**: context menu, text capture, platform-specific media scanning
13. **AI tool detection**: domain mapping, model pre-selection
14. **Image analysis**: right-click image → Claude Vision extracts prompt + preview
15. **Paste flow**: popup library, search, copy/insert
16. **Auth integration**: session sharing with web app
17. **Onboarding**: platform login guide, contextual tips on scrape failure

### Phase 1c — Share Links (estimated: ~1 session)

18. **Share toggle + slug generation**: on the prompt detail view
19. **Public page**: `/p/[slug]` with OG tags
20. **Save to library**: button for signed-in visitors

### Phase 1d — Trending Prompts (estimated: ~1-2 sessions)

21. **Trending section UI**: Higgsfield-style gallery sections on dashboard home
22. **Featured prompts system**: is_featured flag, category assignment, admin curation tools
23. **trend_insights table + /last30days integration**: trend research stored in DB
24. **Trend context rendering**: dynamic headlines, descriptions, 🔥 badges
25. **"Save to My Library" from trending**: one-click save featured prompts to personal library
26. **Content seeding**: Mario curates initial 50-100 prompts using the Chrome extension

---

## Visual Design

### Design Reference: Higgsfield.ai

The dashboard and prompt library should feel like Higgsfield's gallery pages — a visual,
content-forward masonry grid where the images ARE the interface.

### Higgsfield Design Patterns to Adopt

**1. Masonry Grid Layout (prompt library)**
- 5 columns on desktop, 3 on tablet, 2 on mobile
- Varying card heights based on cover image aspect ratio (portrait, landscape, square mixed)
- Very tight gaps between cards (~6px)
- Subtle rounded corners (~8px)
- Images/videos fill cards edge to edge — no internal padding, no text below the image

**2. Card Hover Effects**
- **Image prompt cards**: bottom overlay fades in (gradient from transparent to dark)
  showing prompt title (left) and quick actions: copy, share, favorite (right)
- **Video prompt cards**: video auto-plays on hover (muted, looped), same overlay
- Small ▶ play icon in bottom-left corner on video cards when NOT hovered
- Smooth fade transition (~200ms)

**3. Category/Section Headers (for folder or model views)**
- Category name in coral accent (#e8764b), ALL CAPS, bold, large
- Subtitle in grey below
- Can be used when browsing by folder: "VIDEO PROMPTS", "IMAGE PROMPTS", etc.

**4. Tag Filter Pills**
- Horizontal scrollable row of tag pills at the top of the grid
- Outlined style (border, not filled), rounded
- Click to filter, active state fills with coral
- ‹ › scroll arrows on the sides when overflow

**5. "View All" Pattern**
- Centered button at the bottom of filtered views
- Coral accent with arrow icon

### Super Prompts Adaptation

Carries over from Phase 0 landing page:
- **Background**: #040406 (ultra-dark)
- **Surfaces**: #111116 (cards), glass morphism (backdrop-blur)
- **Brand accent**: coral #e8764b (replaces Higgsfield's lime/chartreuse)
- **Text**: #f0eff2 (primary), #8a8a9a (secondary)
- **Fonts**: DM Sans (UI), Space Mono (labels/tags/model badges)
- **Effects**: subtle gradient orbs, glass borders, coral glow on interactive elements

### Prompt Card Design

```
Normal state:                    Hover state:
┌──────────────┐                 ┌──────────────┐
│              │                 │              │
│  cover image │                 │  cover image │  ← video plays if video
│  fills card  │                 │  (or video)  │
│              │                 │              │
│              │                 │ ▼ gradient   │
│          [▶] │  ← video icon   │ Title here   │
└──────────────┘                 │ [📋] [♡] [↗] │  ← copy, fav, share
                                 └──────────────┘

Model badge (top-left):          Tags (top-right, optional):
┌──────────────┐
│ [Midjourney] │
│              │
```

- Cover image/video fills the entire card (object-fit: cover)
- Model badge: small pill in top-left corner (glass background, model name + tiny icon)
- On hover: bottom gradient overlay appears with title + quick action icons
- Video cards: ▶ icon bottom-left when idle, auto-play on hover
- Favorite indicator: small ♡ or filled heart
- No text visible by default — image-first, just like Higgsfield

### Grid vs List Toggle

**Grid view** (default, Higgsfield-style):
- Masonry layout, image-forward, hover to see details
- Best for visual browsing

**List view** (power user mode):
- Compact rows: small thumbnail (64×64) | title | model | tags | date | actions
- Best for searching and managing large libraries
- Similar to a file manager or spreadsheet view
