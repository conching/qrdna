export interface ScheduleRule {
  days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  destination: string;
  timezone: string; // IANA timezone
}

export interface ScheduledRedirects {
  rules: ScheduleRule[];
  defaultDestination: string;
  isActive: boolean;
}

export interface ExpiryPageConfig {
  isEnabled: boolean;
  title: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface RoutingRule {
  type: "device" | "language" | "country";
  condition: {
    deviceType?: "mobile" | "tablet" | "desktop";
    language?: string;
    country?: string;
  };
  destination: string;
}

/** Evaluate scheduled redirects to find the active destination */
export function evaluateSchedule(config: ScheduledRedirects): string {
  if (!config.isActive || config.rules.length === 0)
    return config.defaultDestination;

  const now = new Date();

  for (const rule of config.rules) {
    const tz = rule.timezone || "UTC";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts
      .find((p) => p.type === "weekday")
      ?.value?.toLowerCase()
      .slice(0, 3);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    const currentTime = `${hour}:${minute}`;

    if (
      weekday &&
      rule.days.includes(weekday as ScheduleRule["days"][number]) &&
      currentTime >= rule.startTime &&
      currentTime < rule.endTime
    ) {
      return rule.destination;
    }
  }

  return config.defaultDestination;
}
