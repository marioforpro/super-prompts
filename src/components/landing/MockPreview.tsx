const sidebarItems = [
  { name: "All Prompts", color: "#ff8b3b", active: true, count: 127 },
  { name: "Video FX", color: "#e43f5a", active: false, count: 43 },
  { name: "Portraits", color: "#38b6ff", active: false, count: 31 },
  { name: "Sound Design", color: "#28c840", active: false, count: 18 },
  { name: "Product Shots", color: "#ffbd2e", active: false, count: 24 },
];

const cards = [
  {
    title: "Cinematic sunset aerial",
    badge: "Sora",
    badgeBg: "rgba(255,107,43,0.15)",
    badgeColor: "#ff8b3b",
    gradient: "linear-gradient(135deg, #0d0d0d, #1a1a2e, #ff6b2b, #ffb347)",
    fav: true,
  },
  {
    title: "Neon portrait cyberpunk",
    badge: "Midjourney",
    badgeBg: "rgba(56,182,255,0.15)",
    badgeColor: "#38b6ff",
    gradient: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #e94560)",
    fav: false,
  },
  {
    title: "Ambient forest texture",
    badge: "Suno",
    badgeBg: "rgba(40,200,64,0.15)",
    badgeColor: "#28c840",
    gradient: "linear-gradient(135deg, #2d1b69, #11998e, #38ef7d)",
    fav: true,
  },
  {
    title: "Slow motion liquid pour",
    badge: "Kling",
    badgeBg: "rgba(228,63,90,0.15)",
    badgeColor: "#e43f5a",
    gradient: "linear-gradient(135deg, #200122, #6f0000, #e94560)",
    fav: false,
  },
  {
    title: "Minimal product flat lay",
    badge: "FLUX",
    badgeBg: "rgba(255,189,46,0.15)",
    badgeColor: "#ffbd2e",
    gradient: "linear-gradient(135deg, #141e30, #243b55, #38b6ff)",
    fav: false,
  },
  {
    title: "Abstract motion trails",
    badge: "Runway",
    badgeBg: "rgba(255,107,43,0.15)",
    badgeColor: "#ff8b3b",
    gradient: "linear-gradient(135deg, #0c0c0c, #1a1a2e, #e94560, #f38181)",
    fav: true,
  },
  {
    title: "Drone through clouds",
    badge: "VEO",
    badgeBg: "rgba(255,107,43,0.15)",
    badgeColor: "#ff8b3b",
    gradient: "linear-gradient(135deg, #1b1b2f, #162447, #1f4068, #e43f5a)",
    fav: false,
  },
  {
    title: "Vintage film grain style",
    badge: "Seedream",
    badgeBg: "rgba(56,182,255,0.15)",
    badgeColor: "#38b6ff",
    gradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    fav: false,
  },
];

export default function MockPreview() {
  return (
    <section className="px-6 md:px-8 pb-24 relative">
      <div
        className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-surface-300 bg-surface-50 relative scanlines"
        style={{
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)",
          animation: "fadeUp 1s ease-out 0.8s both",
        }}
      >
        {/* Window chrome with search */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-100 border-b border-surface-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-xs text-text-dim font-medium">
              Super Prompts — My Library
            </span>
          </div>
          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 bg-surface-200 border border-surface-300 rounded-lg px-3 py-1.5 min-w-[180px]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-dim shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="text-[0.65rem] text-text-dim cursor-blink">
              Search prompts...
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-[340px]">
          {/* Sidebar with counts */}
          <div className="w-[200px] shrink-0 p-4 border-r border-surface-300 bg-surface-100 hidden md:flex flex-col">
            <div className="flex-1">
              {sidebarItems.map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-all duration-200 ${
                    item.active
                      ? "bg-brand-500/8 text-brand-400"
                      : "text-text-muted"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-[3px] shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="flex-1">{item.name}</span>
                  <span
                    className={`text-[0.6rem] ${
                      item.active ? "text-brand-400/60" : "text-text-dim"
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            {/* Sidebar bottom */}
            <div className="pt-4 border-t border-surface-300 mt-4">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-brand-400 font-semibold">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="shrink-0"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Folder
              </div>
            </div>
          </div>

          {/* Card grid */}
          <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {cards.map((card) => (
              <div
                key={card.title}
                className="group rounded-[10px] overflow-hidden border border-surface-300 bg-surface-200 transition-all duration-300 hover:border-brand-500/30 hover:-translate-y-0.5"
              >
                {/* Card image with optional favorite */}
                <div
                  className="h-[90px] w-full relative"
                  style={{ background: card.gradient }}
                >
                  {card.fav && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="#ff6b2b"
                        stroke="none"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <div className="text-[0.65rem] font-semibold text-foreground mb-1 truncate">
                    {card.title}
                  </div>
                  <span
                    className="text-[0.55rem] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: card.badgeBg,
                      color: card.badgeColor,
                    }}
                  >
                    {card.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Caption below preview */}
      <p
        className="text-center text-text-dim text-xs mt-6 tracking-wide"
        style={{ animation: "fadeIn 1s ease-out 1.5s both" }}
      >
        Your prompt library, beautifully organized
      </p>
    </section>
  );
}
