import { TeamKey } from "@prisma/client";

export type RoleSlug =
  | "video-creator"
  | "script-writer"
  | "video-editor"
  | "social-media"
  | "graphic-designer"
  | "seo";

export type RoleContent = {
  slug: RoleSlug;
  key: TeamKey;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accent: string;
  emoji: string;
  weekly: string;
  responsibilities: string[];
  skills: string[];
  learn: string[];
  collaboration: string;
  expectations: string[];
  examples: string[];
};

export const ROLES: RoleContent[] = [
  {
    slug: "video-creator",
    key: "VIDEO_CREATOR",
    name: "AP Video Creator",
    shortName: "Video",
    tagline: "Turn AP topics into videos students actually watch.",
    description:
      "Creates AP review videos for social media — the face and voice of AP Blitz on camera.",
    accent: "#3ee0ff",
    emoji: "🎥",
    weekly: "2–4 short-form videos per week, depending on the content calendar.",
    responsibilities: [
      "Creating educational AP review videos",
      "Explaining AP concepts clearly, without sounding like a textbook",
      "Recording short-form educational content",
      "Following scripts and content plans",
      "Meeting video deadlines",
      "Collaborating with script writers and editors",
    ],
    skills: [
      "Comfort on camera (even if you're still getting used to it)",
      "Clear speaking and energy",
      "Basic understanding of at least one AP subject you want to cover",
      "Reliability with recording deadlines",
    ],
    learn: [
      "How to teach a concept in under 60 seconds",
      "On-camera presence and educational storytelling",
      "How a real content team ships work on a schedule",
    ],
    collaboration:
      "You work from approved scripts. Script writers set the words, you bring them to life, then video editors take your footage and make it scroll-stopping.",
    expectations: [
      "Record on time once a script is assigned",
      "Flag issues early if a script doesn't feel filmable",
      "Upload source footage in the workspace — don't just drop it in the group chat",
    ],
    examples: [
      "Film a 45-second APUSH DBQ hook using this week's approved script",
      "Record three takes of an AP Calc related-rates explainer",
      "Re-record a line the editor flagged as unclear",
    ],
  },
  {
    slug: "script-writer",
    key: "SCRIPT_WRITER",
    name: "Script Writer",
    shortName: "Scripts",
    tagline: "Write the words that make AP content click.",
    description:
      "Writes scripts for YouTube and Instagram content and helps develop video ideas.",
    accent: "#ff914d",
    emoji: "✍️",
    weekly: "3–5 scripts per week, plus revisions when creators or admins request them.",
    responsibilities: [
      "Writing AP educational scripts",
      "Turning AP topics into engaging short-form videos",
      "Creating strong hooks",
      "Organizing information clearly",
      "Working with AP Video Creators",
      "Revising scripts when requested",
      "Meeting deadlines",
    ],
    skills: [
      "Clear writing",
      "A sense for what sounds good out loud",
      "Comfort summarizing AP content accurately",
      "Openness to edits",
    ],
    learn: [
      "Short-form educational writing",
      "Hook writing and pacing",
      "How scripts move through a real production pipeline",
    ],
    collaboration:
      "Social media sends ideas. You turn them into scripts in the writer workspace. Creators film from your draft. If something doesn't land on camera, you revise.",
    expectations: [
      "Write in the AP Blitz script workspace — not in random docs",
      "Keep facts accurate; if you're unsure, flag it",
      "Submit on time so recording isn't blocked",
    ],
    examples: [
      "Write a 50-second script on AP Bio natural selection with a trend-aware hook",
      "Turn a strategist idea into a skit + explainer hybrid",
      "Revise a script after a creator says the middle is too dense",
    ],
  },
  {
    slug: "video-editor",
    key: "VIDEO_EDITOR",
    name: "Video Editor",
    shortName: "Edit",
    tagline: "Make the cut feel like AP Blitz, not a class lecture.",
    description: "Edits short-form AP educational content for social media.",
    accent: "#ff6b4a",
    emoji: "✂️",
    weekly: "3–5 edits per week, matching whatever creators submit.",
    responsibilities: [
      "Editing videos",
      "Adding captions",
      "Adding graphics",
      "Improving pacing",
      "Making content appropriate for social media",
      "Following the AP Blitz visual style",
      "Meeting editing deadlines",
    ],
    skills: [
      "CapCut, Premiere, Final Cut, or similar",
      "Captioning and text-on-screen",
      "A feel for pacing and trends",
      "File organization",
    ],
    learn: [
      "Short-form educational editing",
      "How branding shows up in motion",
      "Working against real posting deadlines",
    ],
    collaboration:
      "Creators upload source footage. You edit, caption, and pace it. Graphic design may send overlays or thumbnails. SEO needs the final cut to write titles that match what actually shipped.",
    expectations: [
      "Download source files from the workspace",
      "Upload the finished edit where the team can review it",
      "Don't sit on a video — if you're blocked, say so",
    ],
    examples: [
      "Edit a 58-second AP Lang rhetorical analysis reel with captions",
      "Add AP Blitz end-card and lower-thirds",
      "Recut a video that came back as 'needs revision' for pacing",
    ],
  },
  {
    slug: "social-media",
    key: "SOCIAL_MEDIA",
    name: "Social Media Strategist",
    shortName: "Social",
    tagline: "Find the trend. Make it AP. Ship the idea.",
    description:
      "Finds trends, skits, content ideas, and opportunities for AP Blitz.",
    accent: "#a78bfa",
    emoji: "📱",
    weekly: "3+ ideas or posts per week — that's the floor, not a stretch goal.",
    responsibilities: [
      "Finding Instagram and TikTok trends",
      "Finding relevant AP and student trends",
      "Suggesting skits",
      "Finding content opportunities",
      "Creating post ideas",
      "Sharing ideas with the team",
      "Helping plan the social media calendar",
    ],
    skills: [
      "You already live on Instagram/TikTok",
      "You can explain why an idea would work",
      "Comfort brainstorming in public with the team",
      "A sense of student culture",
    ],
    learn: [
      "Content strategy, not just posting",
      "How ideas become a production calendar",
      "What actually performs for student audiences",
    ],
    collaboration:
      "You submit ideas in the strategist workspace. Admins approve them. Script writers pick them up. That's how a trend becomes an AP Blitz video instead of a message that dies in the chat.",
    expectations: [
      "Submit ideas in the workspace so they can be tracked",
      "Include a trend link when there is one",
      "Hit 3+ usable ideas a week",
    ],
    examples: [
      "Submit a reel idea using this week's audio trend + APUSH unit 6",
      "Pitch a 'things AP students say during May' skit",
      "Suggest three carousel topics for Graphic Design",
    ],
  },
  {
    slug: "graphic-designer",
    key: "GRAPHIC_DESIGN",
    name: "Graphic Designer",
    shortName: "Design",
    tagline: "Make AP look good enough to save.",
    description:
      "Creates Instagram posts, infographics, educational graphics, thumbnails, and other visual content.",
    accent: "#fb7185",
    emoji: "🎨",
    weekly: "3–6 graphics per week, depending on requests in the pipeline.",
    responsibilities: [
      "Creating Instagram graphics",
      "Creating AP infographics",
      "Creating thumbnails",
      "Following AP Blitz branding",
      "Using Canva or other design software",
      "Uploading finished designs",
      "Making revisions when needed",
    ],
    skills: [
      "Canva, Figma, Photoshop, or similar",
      "Layout and hierarchy",
      "Comfort designing for mobile-first feeds",
      "Taking feedback without spiraling",
    ],
    learn: [
      "Educational visual design",
      "Brand-consistent social assets",
      "How design supports a video, not just sits next to it",
    ],
    collaboration:
      "Requests land in your workspace with dimensions, deadlines, and references. You upload PNG/JPG/PDF or drop a Canva link. Founder and admins download from there to post.",
    expectations: [
      "Match the AP Blitz look — don't freestyle a new brand every post",
      "Upload finals in the workspace so nothing lives only on your laptop",
      "Turn around revisions when asked",
    ],
    examples: [
      "Design a 1080×1350 AP Chem solubility infographic",
      "Make a YouTube thumbnail for this week's video",
      "Build a 5-slide carousel from an approved outline",
    ],
  },
  {
    slug: "seo",
    key: "SEO",
    name: "SEO Specialist",
    shortName: "SEO",
    tagline: "Get AP Blitz in front of students who are already searching.",
    description:
      "Works on titles, descriptions, keywords, discoverability, and search optimization.",
    accent: "#34d399",
    emoji: "🔎",
    weekly:
      "Metadata for every piece of content moving toward publish — titles, descriptions, keywords, hashtags.",
    responsibilities: [
      "Creating optimized titles",
      "Researching keywords",
      "Writing descriptions",
      "Optimizing YouTube content",
      "Researching search trends",
      "Helping content reach more students",
      "Tracking performance",
    ],
    skills: [
      "Curiosity about search and YouTube",
      "Clear writing",
      "Comfort researching what students actually type",
      "Attention to detail",
    ],
    learn: [
      "YouTube and Instagram discoverability",
      "Keyword research for education",
      "How packaging changes whether content gets found",
    ],
    collaboration:
      "Once a video is close to done, you write the title, alts, description, hashtags, and search terms. Admin reviews, then it goes out with a posting date on the calendar.",
    expectations: [
      "Don't guess — look up what students search",
      "Submit recommendations in the SEO workspace",
      "Keep titles accurate to the actual video",
    ],
    examples: [
      "Write 3 title options for an APUSH Reconstruction reel",
      "Build a description + hashtag set for an AP Calc video",
      "Research search terms for 'how to write a DBQ'",
    ],
  },
];

export function getRoleBySlug(slug: string) {
  return ROLES.find((role) => role.slug === slug) ?? null;
}

export function getRoleByKey(key: TeamKey) {
  return ROLES.find((role) => role.key === key) ?? null;
}

export const TEAM_KEY_TO_CHANNEL: Record<TeamKey, string> = {
  VIDEO_CREATOR: "VIDEO_CREATOR",
  SCRIPT_WRITER: "SCRIPT_WRITER",
  VIDEO_EDITOR: "VIDEO_EDITOR",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  GRAPHIC_DESIGN: "GRAPHIC_DESIGN",
  SEO: "SEO",
};

export const GRADE_LABELS: Record<string, string> = {
  GRADE_9: "9th Grade",
  GRADE_10: "10th Grade",
  GRADE_11: "11th Grade",
  GRADE_12: "12th Grade",
};
