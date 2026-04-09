import prisma from "@typebot.io/prisma";
import { LOG_PREFIX } from "./constants";

/**
 * Fetches user profile from Meta Graph API and upserts it into the database.
 *
 * API: GET https://graph.facebook.com/v19.0/{psid}?fields=name,first_name,last_name,locale,timezone&access_token=PAGE_TOKEN
 */
export const fetchMessengerProfile = async (
  psid: string,
  workspaceId: string,
  credentialsId: string,
  pageAccessToken: string
): Promise<void> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${psid}?fields=name,first_name,last_name,locale,timezone&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.warn(`${LOG_PREFIX} Failed to fetch user profile from Meta:`, {
        psid,
        errorData,
      });
      return;
    }

    const profile = (await response.json()) as {
      name?: string;
      first_name?: string;
      last_name?: string;
      locale?: string;
      timezone?: number;
    };

    await prisma.messengerContact.upsert({
      where: { psid },
      update: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        name: profile.name,
        locale: profile.locale,
        timezone: profile.timezone,
        lastSeenAt: new Date(),
      },
      create: {
        psid,
        workspaceId,
        credentialsId,
        firstName: profile.first_name,
        lastName: profile.last_name,
        name: profile.name,
        locale: profile.locale,
        timezone: profile.timezone,
      },
    });

    console.log(`${LOG_PREFIX} Successfully fetched and stored profile for psid:`, psid);
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to fetch user profile:`, err);
  }
};
