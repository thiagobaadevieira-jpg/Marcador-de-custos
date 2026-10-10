import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.106.1";

const VAPID_PUBLIC_KEY = "BHIXvH6W9Z6t-o2fJjrO67k5T71vwKvw7vZq2cCAanOf57U1wO6mocKwAP1fp4XHy_KMEmm3vGina0yY962D1iw";
const VAPID_SUBJECT = "mailto:admin@controle-gastos.app";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: privateKey, error: keyError } = await supabase
    .rpc("get_notification_vapid_private_key");

  if (keyError || !privateKey) {
    console.error("VAPID private key is unavailable", keyError?.message);
    return json({ error: "Notification service is not configured" }, 503);
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);

  const now = new Date();
  const currentUTCMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select(
      "id,endpoint,p256dh,auth,notification_time,utc_offset_minutes,notification_title,notification_message",
    )
    .eq("enabled", true);

  if (error) {
    console.error("Failed to load push subscriptions", error.message);
    return json({ error: "Failed to load subscriptions" }, 500);
  }

  const toNotify = (subscriptions ?? []).filter((subscription) => {
    const [hours, minutes] = subscription.notification_time.split(":").map(Number);
    const localMinutes = hours * 60 + minutes;
    const utcTarget =
      ((localMinutes - subscription.utc_offset_minutes) + 1440) % 1440;
    return utcTarget === currentUTCMinutes;
  });

  let sent = 0;
  const errors: string[] = [];

  for (const subscription of toNotify) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: subscription.notification_title,
          body: subscription.notification_message,
          icon: "/icon-192.png",
          badge: "/badge.svg",
          vibrate: [200, 100, 200],
          tag: "remind-gastos",
        }),
      );
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
      } else {
        errors.push(String(error?.message ?? error));
      }
    }
  }

  return json({ sent, checked: toNotify.length, errors });
});

