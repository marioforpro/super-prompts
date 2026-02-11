const sidebarItems = [
  { name: "All Prompts", color: "#ff8b3b", active: true },
  { name: "Video FX", color: "#e43f5a", active: false },
  { name: "Portraits", color: "#38b6ff", active: false },
  { name: "Sound Design", color: "#28c840", active: false },
  { name: "Product Shots", color: "#ffbd2e", active: false },
];

const cards = [
  {
    title: "Cinematic sunset aerial",
    badge: "Sora",
    badgeBg: "rgba(255,107,43,0.15)",
    badgeColor: "#ff8b3b",
    gradient: "linear-gradient(135deg, #0d0d0d, #1a1a2e, #ff6b2b, #ffb347)",
  },
  {
    title: "Neon portrait cyberpunk",
    badge: "Midjourney",
    badgeBg: "rgba(56,182,255,0.15)",
    badgeColor: "#38b6ff",
    gradient: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #e94560)",
  },
  {
    title: "Ambient forest texture",
    badge: "Suno",
    badgeBg: "rgba(40,200,64,0.15)",
    badgeColor: "#28c840",
    gradient: "linear-gradient(135deg, #2d1b69, #11998e, #38ef7d)",
  },
  {
    title: "Slow motion liquid pour",
    badge: "Kling",
    badgeBg: "rgba(228,63,90,0.15)",
    badgeColor: "#e43f5a",
    gradient: "linear-gradient(135deg, #200122, #6f0000, #e94560)",
  },
  {
    title: "Minimal product flat lay",
    badge: "FLUX",
    badgeBg: "rgba(255,189,46,0.15)",
    badgeColor: "#ffbd2e",
    gradient: "linear-gradient(135deg, #141e30, #243b55, #38b6ff)",
  },
  {
    title: "Abstract motion trails",
    badge: "Runway",
    badgeBg: "rgba(255,107,43,0.15)",
    badgeColor: "#ff8b3b",
    gradient: "linear-gradient(135deg, #0c0c0c, #1a1a2e, #e94560, #f38181)",
  },
  {
    title: "Drone through clouds",
    badge: "VEO",
    badgeBg: "rgba(255,107,43,0.15)",
    badgeColor: "#ff8b3b",
    gradient: "linear-gradient(135deg, #1b1b2f, #162447, #1f4068, #e43f5a)",
  },
  {
    title: "Vintage film grain style",
    badge: "Seedream",
    badgeBg: "rgba(56,182,255,0.15)",
    badgeColor: "#38b6ff",
    gradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  },
];

export default function MockPreview() {
  return (
    <section className="px-8 pb-24 relative">
      <div
        className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-surface-300 bg-surface-50"
        style={{
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(255,107,43,0.03)",
          animation: "fadeUp 1s ease-out 0.8s both",
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 border-b border-surface-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-text-dim font-medium">
            Super Prompts — My Library
          </span>
        </div>

        {/* Body */}
        <div className="flex min-h-[340px]">
          {/* Sidebar */}
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
                    className="w-2 h-2 rounded-[3px]"
                    style={{ background: item.color }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
            <div className="pt-8">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-brand-400 font-semibold">
                <div
                  className="w-2 h-2 rounded-[3px]"
                  style={{ background: "#ff8b3b" }}
                />
                + New Folder
              </div>
            </div>
          </div>

          {/* Card grid */}
          <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-[10px] overflow-hidden border border-surface-300 bg-surface-200 transition-all duration-300 hover:border-brand-500/30 hover:-translate-y-0.5"
              >
                <div
                  className="h-[90px] w-full"
                  style={{ background: card.gradient }}
                />
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
    </section>
  );
}
