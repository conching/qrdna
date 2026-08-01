import { describe, it, expect } from "vitest";
import { isBotUserAgent, describeBot } from "../bot";

/**
 * The cost of the two mistakes is not symmetric. Discarding a real scan loses
 * data the customer is paying attention to; counting one extra preview inflates
 * a number slightly. These tests weight accordingly — the false-positive cases
 * below matter more than the coverage ones.
 */

const REAL_SCANS = [
  // iOS Camera hands off to Safari
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  // Android Chrome
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  // Samsung Internet
  "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
  // Desktop macOS Safari — someone opening the link on a laptop
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15",
  // Firefox on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
];

const CRAWLERS = [
  // The one that actually turned up in production
  "facebookexternalhit/1.1 Facebot Twitterbot/1.0",
  "Mozilla/5.0 (compatible; Twitterbot/1.0)",
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "WhatsApp/2.23.20.0 A",
  "Mozilla/5.0 (compatible; LinkedInBot/1.0)",
  "Mozilla/5.0 (compatible; Discordbot/2.0)",
  "TelegramBot (like TwitterBot)",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; bingbot/2.0)",
  "curl/8.7.1",
  "python-requests/2.31.0",
  "Go-http-client/1.1",
  "PostmanRuntime/7.37.0",
];

describe("does not discard real scans", () => {
  it.each(REAL_SCANS)("keeps %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });

  it("keeps a CUBOT handset, despite the brand containing 'bot'", () => {
    // A naive /bot/i check silently drops every scan from these phones.
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Linux; Android 11; CUBOT_X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
  });

  it("keeps Safari Technology Preview, which is a browser people use", () => {
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/620.1.1 (KHTML, like Gecko) Safari Technology Preview/20.0",
      ),
    ).toBe(false);
  });

  it("keeps other device names that embed a trigger word", () => {
    for (const ua of [
      "Mozilla/5.0 (Linux; Android 12; Cubot Note 20)",
      "Mozilla/5.0 (Linux; Android 10; Robot X1) AppleWebKit/537.36",
      "Mozilla/5.0 (Linux; Android 11; SPIDERMAN-A1) AppleWebKit/537.36",
    ]) {
      expect(isBotUserAgent(ua)).toBe(false);
    }
  });
});

describe("catches crawlers", () => {
  it.each(CRAWLERS)("flags %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it("flags a delimited generic token", () => {
    expect(isBotUserAgent("SomeNewThing Bot/2.0")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; NewCrawler/1.0)")).toBe(true);
  });

  it("treats a missing or blank agent as automated", () => {
    // Every real scanner sends one.
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("   ")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isBotUserAgent("FACEBOOKEXTERNALHIT/1.1")).toBe(true);
    expect(isBotUserAgent("slackbot-linkexpanding")).toBe(true);
  });
});

describe("describeBot", () => {
  it("names the platform where it can", () => {
    expect(describeBot("facebookexternalhit/1.1 Facebot")).toBe(
      "Facebook link preview",
    );
    expect(describeBot("Slackbot-LinkExpanding 1.0")).toBe("Slack link preview");
    expect(describeBot("Mozilla/5.0 (compatible; Twitterbot/1.0)")).toBe(
      "X / Twitter link preview",
    );
  });

  it("falls back without inventing a name", () => {
    expect(describeBot("curl/8.7.1")).toBe("Automated client");
    expect(describeBot(null)).toBe("Unknown client");
  });
});
