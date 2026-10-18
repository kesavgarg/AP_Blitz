import "server-only";
import { ChannelKind, TeamKey } from "@prisma/client";
import { isFounder, leadsTeam, onTeam, type SessionUser } from "@/lib/auth";

const CHANNEL_TEAM: Partial<Record<string, TeamKey>> = {
  VIDEO_CREATOR: "VIDEO_CREATOR",
  SCRIPT_WRITER: "SCRIPT_WRITER",
  VIDEO_EDITOR: "VIDEO_EDITOR",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  GRAPHIC_DESIGN: "GRAPHIC_DESIGN",
  FIVE_FOR_FIVE: "FIVE_FOR_FIVE",
};

export type ChannelAccess = {
  key: string | null;
  kind?: ChannelKind | string;
  members?: { userId: string }[];
};

export function channelAudience(channel: ChannelAccess) {
  const kind = channel.kind ?? "TEAM";
  if (kind === "SUBJECT") return "Everyone on AP Blitz can see this AP subject chat.";
  if (kind === "DM") return "Just the two of you. Not posted to a group chat.";
  if (channel.key === "GENERAL") return "Everyone on AP Blitz can see this.";
  if (channel.key === "ADMIN") return "Founders and team admins only. Members cannot see this channel.";
  return "Only this role’s team (and Kesav) can see this.";
}

export function sortChannels<T extends ChannelAccess & { name: string }>(channels: T[]) {
  const rank = (c: ChannelAccess) => {
    const kind = c.kind ?? "TEAM";
    if (c.key === "GENERAL") return 0;
    if (kind === "SUBJECT") return 1;
    if (kind === "TEAM" && c.key !== "ADMIN") return 2;
    if (kind === "DM") return 3;
    if (c.key === "ADMIN") return 99;
    return 4;
  };
  return [...channels].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function canAccessTeamChannel(user: SessionUser, key: string) {
  if (key === "SEO") return false;
  if (isFounder(user)) return true;
  if (key === "GENERAL") return true;
  if (key === "ADMIN") return user.role === "FOUNDER" || user.role === "TEAM_ADMIN";
  const team = CHANNEL_TEAM[key];
  return team ? onTeam(user, team) : false;
}

export function canAccessChannel(user: SessionUser, channel: ChannelAccess | string) {
  if (typeof channel === "string") return canAccessTeamChannel(user, channel);
  const kind = channel.kind ?? "TEAM";
  if (isFounder(user)) return true;
  if (kind === "SUBJECT") return true;
  if (kind === "DM") return Boolean(channel.members?.some((m) => m.userId === user.id));
  return canAccessTeamChannel(user, channel.key ?? "");
}

export function canModerateChannel(user: SessionUser, channel: ChannelAccess | string) {
  if (typeof channel === "string") {
    if (isFounder(user)) return true;
    if (channel === "ADMIN") return user.role === "FOUNDER";
    const team = CHANNEL_TEAM[channel];
    return team ? leadsTeam(user, team) : false;
  }
  if (isFounder(user)) return true;
  const kind = channel.kind ?? "TEAM";
  if (kind === "SUBJECT") return user.role === "FOUNDER" || user.role === "TEAM_ADMIN";
  if (kind === "DM") return false;
  if (channel.key === "ADMIN") return user.role === "FOUNDER";
  const team = channel.key ? CHANNEL_TEAM[channel.key] : undefined;
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
    case "FIVE_FOR_FIVE":
      return "/workspace/five";
    default:
      return "/workspace";
  }
}
