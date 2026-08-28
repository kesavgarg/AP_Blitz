import "server-only";
import { ChannelKey, TeamKey } from "@prisma/client";
import { isFounder, leadsTeam, onTeam, type SessionUser } from "@/lib/auth";

const CHANNEL_TEAM: Partial<Record<ChannelKey, TeamKey>> = {
  VIDEO_CREATOR: "VIDEO_CREATOR",
  SCRIPT_WRITER: "SCRIPT_WRITER",
  VIDEO_EDITOR: "VIDEO_EDITOR",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  GRAPHIC_DESIGN: "GRAPHIC_DESIGN",
  SEO: "SEO",
};

export function channelAudience(key: ChannelKey) {
  if (key === "GENERAL") return "Everyone on AP Blitz can see this.";
  if (key === "ADMIN") return "Founders and team admins only. Members cannot see this channel.";
  return "Only this role’s team (and Kesav) can see this.";
}

export function sortChannels<T extends { key: ChannelKey; name: string }>(channels: T[]) {
  const rank = (key: ChannelKey) => (key === "GENERAL" ? 0 : key === "ADMIN" ? 99 : 1);
  return [...channels].sort((a, b) => rank(a.key) - rank(b.key) || a.name.localeCompare(b.name));
}

export function canAccessChannel(user: SessionUser, key: ChannelKey) {
  if (isFounder(user)) return true;
  if (key === "GENERAL") return true;
  if (key === "ADMIN") return user.role === "FOUNDER" || user.role === "TEAM_ADMIN";
  const team = CHANNEL_TEAM[key];
  return team ? onTeam(user, team) : false;
}

export function canModerateChannel(user: SessionUser, key: ChannelKey) {
  if (isFounder(user)) return true;
  if (key === "ADMIN") return user.role === "FOUNDER";
  const team = CHANNEL_TEAM[key];
  return team ? leadsTeam(user, team) : false;
}

export function canAccessTeamData(user: SessionUser, key: TeamKey) {
  return onTeam(user, key);
}

export function canManageTeam(user: SessionUser, key: TeamKey) {
  return leadsTeam(user, key);
}

export function canReviewApplications(user: SessionUser) {
  return user.role === "FOUNDER" || user.role === "TEAM_ADMIN";
}

export function canManageOrg(user: SessionUser) {
  return isFounder(user);
}

export function canSeeAllContent(user: SessionUser) {
  return isFounder(user);
}

export function workspaceForTeam(key: TeamKey) {
  switch (key) {
    case "SCRIPT_WRITER":
      return "/workspace/scripts";
    case "VIDEO_CREATOR":
      return "/workspace/video";
    case "VIDEO_EDITOR":
      return "/workspace/edit";
    case "GRAPHIC_DESIGN":
      return "/workspace/design";
    case "SOCIAL_MEDIA":
      return "/workspace/social";
    case "SEO":
      return "/workspace/seo";
  }
}
