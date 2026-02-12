const sidebarItems = [
  { name: "All Prompts", color: "#e8764b", active: true, count: 127 },
  { name: "Video FX", color: "#e84373", active: false, count: 43 },
  { name: "Portraits", color: "#3ba0d8", active: false, count: 31 },
  { name: "Sound Design", color: "#2ebb4e", active: false, count: 18 },
  { name: "Product Shots", color: "#f0a050", active: false, count: 24 },
];

const cards = [
  {
    title: "Cinematic sunset aerial",
    badge: "Sora",
    badgeBg: "rgba(232,118,75,0.1)",
    badgeColor: "#d4663e",
    gradient: "linear-gradient(135deg, #fdb99b, #e8764b, #cf5c36, #a84a2e)",
    fav: true,
  },
  {
    title: "Neon portrait cyberpunk",
    badge: "Midjourney",
    badgeBg: "rgba(59,160,216,0.1)",
    badgeColor: "#2a7fb8",
    gradient: "linear-gradient(135deg, #89cff0, #3ba0d8, #1b6fa0, #0d4f7a)",
    fav: false,
  },
  {
    title: "Ambient forest texture",
    badge: "Suno",
    badgeBg: "rgba(46,187,78,0.1)",
    badgeColor: "#1e8a3a",
    gradient: "linear-gradient(135deg, #95e8a8, #40c463, #2d8f4e, #1a6b35)",
    fav: true,
  },
  {
    title: "Slow motion liquid pour",
    badge: "Kling",
    badgeBg: "rgba(232,67,115,0.1)",
    badgeColor: "#c83060",
    gradient: "linear-gradient(135deg, #fba4c4, #e84373, #c83060, #9b2550)",
    fav: false,
  },
  {
    title: "Minimal product flat lay",
    badge: "FLUX",
    badgeBg: "rgba(240,160,80,0.1)",
    badgeColor: "#c47828",
    gradient: "linear-gradient(135deg, #bde0fe, #89c2f5, #5fa3e6, #3d87d4)",
    fav: false,
  },
  {
    title: "Abstract motion trails",
    badge: "Runway",
    badgeBg: "rgba(232,118,75,0.1)",
    badgeColor: "#d4663e",
    gradient: "linear-gradient(135deg, #fba4c4, #e06888, #c84b6b, #a83858)",
    fav: true,
  },
  {
    title: "Drone through clouds",
    badge: "VEO",
    badgeBg: "rgba(130,90,210,0.1)",
    badgeColor: "#7b55c0",
    gradient: "linear-gradient(135deg, #c4b0e8, #9b7ed8, #7b55c0, #5d3ea0)",
    fav: false,
  },
  {
    title: "Vintage film grain style",
    badge: "Seedream",
    badgeBg: "rgba(200,168,120,0.12)",
    badgeColor: "#9a7848",
    gradient: "linear-gradient(135deg, #f0dfc8, #d4b88a, #b89868, #9a7848)",
    fav: false,
  },
];

export default function MockPreview() {
  return (
    <section className="px-6 md:px-8 pb-24 relative">
      <div
        className="max-w-6xl mx-auto rounded-2xl overflow-hidden border border-surface-200 bg-white relative"
        style={{
          animation: "fadeUp 1s ease-out 0.8s both",
          boxShadow: "0 8px 40px rgba(42,37,34,0.06), 0 1px 3px rgba(42,37,34,0.04)",
        }}
      >
        {/* Window chrome with search */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-50 border-b border-surface-200">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-sm text-text-dim font-medium">
              Super Prompts — My Library
            </span>
          </div>
          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 bg-white border border-surface-200 rounded-lg px-4 py-2 min-w-[200px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-dim shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="text-xs text-text-dim cursor-blink">
              Search prompts...
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-[400px]">
          {/* Sidebar with counts */}
          <div className="w-[220px] shrink-0 p-5 border-r border-surface-200 bg-surface-50/50 hidden md:flex flex-col">
            <div className="flex-1">
              {sidebarItems.map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all duration-200 ${
                    item.active
                      ? "bg-brand-50 text-brand-600 font-medium"
                      : "text-text-muted hover:bg-surface-100"
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="flex-1">{item.name}</span>
                  <span
                    className={`text-xs ${
                      item.active ? "text-brand-400" : "text-text-dim"
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            {/* Sidebar bottom */}
            <div className="pt-4 border-t border-surface-200 mt-4">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-brand-500 font-semibold">
                <svg
                  width="12"
                  height="12"
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
          <div className="flex-1 p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 content-start">
            {cards.map((card) => (
              <div
                key={card.title}
                className="group rounded-xl overflow-hidden border border-surface-200 bg-white transition-all duration-300 hover:border-brand-300 hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {/* Card image with optional favorite */}
                <div
                  className="h-[110px] w-full relative"
                  style={{ background: card.gradient }}
                >
                  {card.fav && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="#e8764b"
                        stroke="none"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-xs font-semibold text-foreground mb-1.5 truncate">
                    {card.title}
                  </div>
                  <span
                    className="text-[0.65rem] font-semibold px-2 py-0.5 rounded"
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
        className="text-center text-text-dim text-sm mt-8 tracking-wide"
        style={{ animation: "fadeIn 1s ease-out 1.5s both" }}
      >
        Your prompt library, beautifully organized
      </p>
    </section>
  );
}
